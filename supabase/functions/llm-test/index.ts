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
import { createClient } from '@supabase/supabase-js'
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

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
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
}

// Function to list team members
async function listTeamMembers(teamName: string, authToken: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  });

  // First get the team ID
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('name', teamName)
    .single();

  if (teamError || !teams) {
    throw new Error(`Team not found: ${teamError?.message || 'No team with that name'}`);
  }

  // Then get all users in that team
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('full_name, role, is_team_lead')
    .eq('team_id', teams.id);

  if (userError) {
    throw new Error(`Failed to get team members: ${userError.message}`);
  }

  return JSON.stringify(users, null, 2);
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const startTime = performance.now();
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return createErrorResponse('Please provide a text string in the request body');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401);
    }

    // Extract the JWT token
    const authToken = authHeader.replace('Bearer ', '');

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
        description: "Get a list of all users in a specified team",
        parameters: {
          type: "object",
          properties: {
            teamName: {
              type: "string",
              description: "The name of the team to query"
            }
          },
          required: ["teamName"]
        }
      }],
      function_call: "auto"
    });

    // Get the response
    const responseMessage = completion.choices[0].message;
    let result: string;

    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      // Parse the function arguments
      const { teamName } = JSON.parse(responseMessage.function_call.arguments);
      
      // Call the function
      const functionResult = await listTeamMembers(teamName, authToken);

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
      }
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
