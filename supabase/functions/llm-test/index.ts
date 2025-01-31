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

// Function to list team members
async function listTeamMembers(
  teamName: string, 
  authToken: string,
  skillFilter?: string,
  proficiencyFilter?: string
): Promise<string> {
  const supabase = createSupabaseClient(authToken);

  // Build the base query with proper filtering
  let query = supabase
    .from('users')
    .select(`
      full_name,
      role,
      is_team_lead,
      team:teams!inner (
        name
      ),
      skills:agent_skills!left (
        proficiency:proficiencies!inner (
          name,
          skill:skills!inner (
            name
          )
        )
      )
    `)
    .eq('teams.name', teamName);

  // Get the results
  const { data: users, error } = await query;

  if (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }

  // Filter users based on skills and proficiency in memory
  let filteredUsers = users;
  
  if (skillFilter || proficiencyFilter) {
    filteredUsers = users.filter(user => {
      return user.skills.some(skill => {
        const skillMatches = !skillFilter || skill.proficiency.skill.name === skillFilter;
        const proficiencyMatches = !proficiencyFilter || skill.proficiency.name === proficiencyFilter;
        return skillMatches && proficiencyMatches;
      });
    });
  }

  // Format the results to be more readable
  const formattedUsers = filteredUsers.map(user => ({
    full_name: user.full_name,
    role: user.role,
    is_team_lead: user.is_team_lead,
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

    // Fetch available skills and proficiencies
    const [availableSkills, availableProficiencies] = await Promise.all([
      getAvailableSkills(authToken),
      getAvailableProficiencies(authToken)
    ]);

    trace.push({
      type: 'metadata',
      name: 'available_options',
      result: { skills: availableSkills, proficiencies: availableProficiencies }
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
        name: "listTeamMembers",
        description: "Get a list of all users in a specified team, optionally filtered by skills and/or proficiency levels",
        parameters: {
          type: "object",
          properties: {
            teamName: {
              type: "string",
              description: "The name of the team to query"
            },
            skillFilter: {
              type: "string",
              description: "Filter team members by skill name",
              enum: availableSkills
            },
            proficiencyFilter: {
              type: "string",
              description: "Filter team members by proficiency level",
              enum: availableProficiencies
            }
          },
          required: ["teamName"]
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
        name: 'listTeamMembers',
        arguments: { teamName, skillFilter, proficiencyFilter }
      });

      // Call the function
      const functionResult = await listTeamMembers(teamName, authToken, skillFilter, proficiencyFilter);

      trace.push({
        type: 'function_result',
        name: 'listTeamMembers',
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
            name: "listTeamMembers",
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
