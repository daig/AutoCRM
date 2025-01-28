export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export type ErrorResponse = {
  error: string;
};

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export function createSuccessResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      } 
    }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
} 