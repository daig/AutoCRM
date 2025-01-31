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

const SYSTEM_PROMPT = `You are a "AI Power Tool" that helps find and filter people based on their teams, roles, and skills.

IMPORTANT: You must ALWAYS use the provided tools directly. DO NOT write code examples or explain how to use the tools.
- For queries about users → use listOperators
- For deletion requests → use deleteOperators
- For team reassignment requests → use reassignOperators

When using the tools:
1. For queries, you MUST specify which fields to return based on the user's question. Only list the name by default.
2. When filtering by skills, always include the proficiency level and request the 'skills' field
3. When filtering by team lead status, always include the team name and request the 'team' field
4. When filtering by team, you MUST use the exact team name from the available options.
5. For delete operations, always include the 'name' field and any fields needed to confirm the correct users are being deleted.
6. For reassignment operations, always include both 'name' and 'team' fields to show current and future team assignments.`;


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!
});

// Define the interface for our response
interface AIResponse {
  input: string;
  output: string;
  description: string;
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

interface UserData {
  full_name: string;
  role: string;
  is_team_lead: boolean;
  team?: { name: string };
  skills?: {
    proficiency: {
      name: string;
      skill: {
        name: string;
      };
    };
  }[];
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
  fields: string[],
  teamName?: string,
  skillFilter?: string,
  proficiencyFilter?: string,
  isTeamLead?: boolean,
  operation: 'list' | 'delete' | 'reassign' = 'list',
  targetTeam?: string
): Promise<string> {
  const supabase = createSupabaseClient(authToken);

  // Define available fields and their corresponding query paths
  const fieldMappings: Record<string, string> = {
    name: 'full_name',
    role: 'role',
    is_team_lead: 'is_team_lead',
    team: 'team:teams!inner (name)',
    skills: 'skills:agent_skills (proficiency:proficiencies!inner (name, skill:skills!inner (name)))'
  };

  // Build the select statement based on requested fields
  let selectFields = fields.map(field => fieldMappings[field] || field);

  // If we're filtering by team, ensure team is included in the select
  if (teamName && !selectFields.includes(fieldMappings.team)) {
    selectFields = [...selectFields, fieldMappings.team];
  }

  // If we're filtering by skills, ensure skills is included in the select
  if ((skillFilter || proficiencyFilter) && !selectFields.includes(fieldMappings.skills)) {
    selectFields = [...selectFields, fieldMappings.skills];
  }

  // Start with the base user fields
  let query = supabase
    .from('users')
    .select(selectFields.join(',\n'));

  // Build the filter conditions
  if (teamName) {
    // Filter by team name
    query = query.eq('team.name', teamName);
  }

  // Add team lead filter if specified
  if (isTeamLead !== undefined) {
    query = query.eq('is_team_lead', isTeamLead);
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

  // Format the results based on requested fields
  const formattedUsers = (users as UserData[]).map(user => {
    const result: any = {};
    
    if (!fields || fields.includes('name')) {
      result.name = user.full_name;
    }
    if (!fields || fields.includes('role')) {
      result.role = user.role;
    }
    if (!fields || fields.includes('is_team_lead')) {
      result.is_team_lead = user.is_team_lead;
    }
    if (!fields || fields.includes('team')) {
      result.team = user.team?.name;
      // Add target team for reassign operations
      if (operation === 'reassign' && targetTeam) {
        result.targetTeam = targetTeam;
      }
    }
    if (!fields || fields.includes('skills')) {
      result.skills = user.skills?.map(skill => ({
        skill: skill.proficiency.skill.name,
        proficiency: skill.proficiency.name
      })) || [];
    }

    // Add operation-specific flags
    if (operation === 'delete') {
      result.delete = true;
    } else if (operation === 'reassign') {
      result.reassign = true;
    }
    
    return result;
  });

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
      temperature: 0.2,
      messages: [{
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: text
      }],
      tools: [{
        type: "function",
        function: {
          name: "listOperators",
          description: "Get a list of all operators (users), optionally filtered by team, skills, proficiency levels, and team lead status",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "A concise description suitable for a table header (e.g. 'Team Leads in Technical Support', 'Operators with Database Skills')"
              },
              fields: {
                type: "array",
                description: "List of fields to return for each operator. Only request fields needed for the query.",
                items: {
                  type: "string",
                  enum: ["name", "role", "is_team_lead", "team", "skills"]
                }
              },
              teamName: {
                type: "string",
                description: "The name of the team to filter by",
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
              },
              isTeamLead: {
                type: "boolean",
                description: "Filter to show only team leads (true) or non-team leads (false)"
              }
            },
            required: ["description", "fields"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "deleteOperators",
          description: "Delete a list of operators (users) based on filters.",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "A concise description of what will be deleted (e.g. 'Delete all inactive team leads', 'Remove operators from Technical Support')"
              },
              fields: {
                type: "array",
                description: "List of fields to return for each operator to be deleted. Must include enough information to identify the users.",
                items: {
                  type: "string",
                  enum: ["name", "role", "is_team_lead", "team", "skills"]
                }
              },
              teamName: {
                type: "string",
                description: "The name of the team to filter by",
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
              },
              isTeamLead: {
                type: "boolean",
                description: "Filter to show only team leads (true) or non-team leads (false)"
              }
            },
            required: ["description", "fields"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reassignOperators",
          description: "Reassign a list of operators (users) to a different team based on filters.",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "A concise description of the reassignment operation (e.g. 'Move support agents to Technical Support team')"
              },
              fields: {
                type: "array",
                description: "List of fields to return for each operator. Must include 'name' and 'team' to show the changes.",
                items: {
                  type: "string",
                  enum: ["name", "role", "is_team_lead", "team", "skills"]
                }
              },
              targetTeam: {
                type: "string",
                description: "The team to reassign the users to",
                enum: availableOptions.teams
              },
              teamName: {
                type: "string",
                description: "Filter source users by their current team",
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
              },
              isTeamLead: {
                type: "boolean",
                description: "Filter to show only team leads (true) or non-team leads (false)"
              }
            },
            required: ["description", "fields", "targetTeam"]
          }
        }
      }],
      tool_choice: "required"  // Allow the model to choose any tool, but require a tool call
    });

    trace.push({
      type: 'openai_completion',
      result: completion.choices[0].message
    });

    // Get the response
    const responseMessage = completion.choices[0].message;
    let result: string;

    // Check if the model wants to call a function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      // Parse the function arguments
      const { fields, teamName, skillFilter, proficiencyFilter, isTeamLead, description, targetTeam } = JSON.parse(toolCall.function.arguments);
      
      const isDelete = toolCall.function.name === 'deleteOperators';
      const isReassign = toolCall.function.name === 'reassignOperators';
      
      trace.push({
        type: 'function_call',
        name: toolCall.function.name,
        arguments: { fields, teamName, skillFilter, proficiencyFilter, isTeamLead, description, targetTeam }
      });

      // Call the function
      const functionResult = await listOperators(
        authToken, 
        fields, 
        teamName, 
        skillFilter, 
        proficiencyFilter, 
        isTeamLead, 
        isDelete ? 'delete' : isReassign ? 'reassign' : 'list',
        isReassign ? targetTeam : undefined
      );

      trace.push({
        type: 'function_result',
        name: toolCall.function.name,
        result: functionResult
      });

      const response: AIResponse = {
        input: text,
        output: functionResult,
        description: description,
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Math.round(performance.now() - startTime),
          ...(isReassign ? { targetTeam } : {})
        },
        trace
      };

      return createSuccessResponse(response);
    } else {
      const response: AIResponse = {
        input: text,
        output: responseMessage.content,
        description: "Natural language response",
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Math.round(performance.now() - startTime)
        },
        trace
      };

      return createSuccessResponse(response);
    }
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
