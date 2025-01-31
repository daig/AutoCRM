// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this Deno style guide: https://deno.land/manual/contributing/style_guide
import { serve } from "@std/http/server"
import { 
  handleCorsPreflightRequest, 
  createSuccessResponse, 
  createErrorResponse 
} from "../_shared/cors.ts"
import { createSupabaseClient, getAuthToken } from "../_shared/supabaseClient.ts"
import OpenAI from "openai"

// Add Deno types
declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }
}

const Deno = window.Deno;

console.log("Hello from Functions!")

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!
});

// Define the interface for our response
interface AIResponse {
  input: string;
  output: string;
  metadata: {
    processedAt: string;
    processingTimeMs: number;
  };
  trace: {
    type: string;
    name?: string;
    arguments?: any;
    result?: any;
  }[];
}

interface AvailableOptions {
  teams: string[];
  skills: string[];
  proficiencies: string[];
}

// Function to get all available options in a single query
async function getAvailableOptions(authToken: string): Promise<AvailableOptions> {
  const supabase = createSupabaseClient(authToken);
  
  const [teamsResult, skillsResult, proficienciesResult] = await Promise.all([
    supabase.from('teams').select('name').order('name'),
    supabase.from('skills').select('name').order('name'),
    supabase.from('proficiencies').select('name').order('name')
  ]);

  if (teamsResult.error) {
    throw new Error(`Failed to get teams: ${teamsResult.error.message}`);
  }
  if (skillsResult.error) {
    throw new Error(`Failed to get skills: ${skillsResult.error.message}`);
  }
  if (proficienciesResult.error) {
    throw new Error(`Failed to get proficiencies: ${proficienciesResult.error.message}`);
  }

  return {
    teams: teamsResult.data.map(team => team.name),
    skills: skillsResult.data.map(skill => skill.name),
    proficiencies: [...new Set(proficienciesResult.data.map(p => p.name))]
  };
}

// Function to list operators
async function listOperators(
  authToken: string,
  teamName?: string,
  skillFilter?: string,
  proficiencyFilter?: string
): Promise<string> {
  const supabase = createSupabaseClient(authToken);

  // Start with the base user fields
  let query = supabase
    .from('users')
    .select(`
      full_name,
      role,
      is_team_lead,
      team:teams (
        name
      ),
      skills:agent_skills (
        proficiency:proficiencies!inner (
          name,
          skill:skills!inner (
            name
          )
        )
      )
    `);

  // Build the filter conditions
  if (teamName) {
    // Inner join with teams when filtering by team
    query = query
      .eq('teams.name', teamName)
      .not('team', 'is', null);
  }

  if (skillFilter || proficiencyFilter) {
    // Inner join with skills when filtering by skills/proficiencies
    query = query.not('skills', 'is', null);
    
    if (skillFilter) {
      query = query.eq('skills.proficiency.skill.name', skillFilter);
    }
    if (proficiencyFilter) {
      query = query.eq('skills.proficiency.name', proficiencyFilter);
    }
  }

  // Get the filtered results
  const { data: users, error } = await query;

  if (error) {
    throw new Error(`Failed to get operators: ${error.message}`);
  }

  // Format the results to be more readable
  const formattedUsers = users.map(user => ({
    full_name: user.full_name,
    role: user.role,
    is_team_lead: user.is_team_lead,
    team: user.team?.name,
    skills: user.skills?.map(skill => ({
      skill: skill.proficiency.skill.name,
      proficiency: skill.proficiency.name
    })) || []
  }));

  return JSON.stringify(formattedUsers, null, 2);
}

// Function to get all available skills
async function getAvailableSkills(authToken: string): Promise<string[]> {
  const supabase = createSupabaseClient(authToken);
  const { data: skills, error } = await supabase
    .from('skills')
    .select('name');

  if (error) {
    throw new Error(`Failed to get skills: ${error.message}`);
  }

  return skills.map(skill => skill.name);
}

// Function to get all available proficiency levels
async function getAvailableProficiencies(authToken: string): Promise<string[]> {
  const supabase = createSupabaseClient(authToken);
  const { data: proficiencies, error } = await supabase
    .from('proficiencies')
    .select('name')
    .order('name');

  if (error) {
    throw new Error(`Failed to get proficiencies: ${error.message}`);
  }

  // Get unique proficiency names
  const uniqueProficiencies = [...new Set(proficiencies.map(p => p.name))];
  return uniqueProficiencies;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const startTime = performance.now();
    const { text } = await req.json();
    const trace: AIResponse['trace'] = [];
    
    if (!text || typeof text !== 'string') {
      return createErrorResponse('Please provide a text string in the request body');
    }

    // Get auth token from request
    let authToken: string;
    try {
      authToken = getAuthToken(req);
    } catch (error) {
      return createErrorResponse(error.message, 401);
    }

    // Fetch all available options in a single operation
    const availableOptions = await getAvailableOptions(authToken);

    trace.push({
      type: 'metadata',
      name: 'available_options',
      result: availableOptions
    });

    // Call OpenAI with function definition
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [{
        role: "user",
        content: text
      }],
      functions: [{
        name: "listOperators",
        description: "Get a list of all operators (users), optionally filtered by team, skills, and/or proficiency levels",
        parameters: {
          type: "object",
          properties: {
            teamName: {
              type: "string",
              description: "Optional. The name of the team to filter by",
              enum: availableOptions.teams
            },
            skillFilter: {
              type: "string",
              description: "Filter operators by skill name",
              enum: availableOptions.skills
            },
            proficiencyFilter: {
              type: "string",
              description: "Filter operators by proficiency level",
              enum: availableOptions.proficiencies
            }
          }
        }
      }],
      function_call: "auto"
    });

    trace.push({
      type: 'openai_completion',
      result: completion.choices[0].message
    });

    // Get the response
    const responseMessage = completion.choices[0].message;
    let result: string;

    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      // Parse the function arguments
      const { teamName, skillFilter, proficiencyFilter } = JSON.parse(responseMessage.function_call.arguments);
      
      trace.push({
        type: 'function_call',
        name: 'listOperators',
        arguments: { teamName, skillFilter, proficiencyFilter }
      });

      // Call the function
      const functionResult = await listOperators(authToken, teamName, skillFilter, proficiencyFilter);

      trace.push({
        type: 'function_result',
        name: 'listOperators',
        result: functionResult
      });

      // Get the final response from OpenAI
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: text
          },
          responseMessage,
          {
            role: "function",
            name: "listOperators",
            content: functionResult
          }
        ]
      });

      trace.push({
        type: 'openai_completion',
        result: secondResponse.choices[0].message
      });

      result = secondResponse.choices[0].message.content;
    } else {
      result = responseMessage.content;
    }

    const response: AIResponse = {
      input: text,
      output: result,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTimeMs: Math.round(performance.now() - startTime)
      },
      trace
    };

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make sure you have set the OPENAI_API_KEY and SUPABASE_ANON_KEY environment variables
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/llm-test' \
    --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"text":"Who are the members of the Technical Support team?"}'

*/
