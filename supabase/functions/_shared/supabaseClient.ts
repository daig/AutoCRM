import { createClient } from '@supabase/supabase-js';

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

// Initialize base Supabase configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Creates a Supabase client with the provided auth token
 * @param authToken JWT token for authentication
 * @returns Supabase client instance
 */
export function createSupabaseClient(authToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  });
}

/**
 * Gets the auth token from the request headers
 * @param req Request object
 * @returns Auth token string
 * @throws Error if auth header is missing
 */
export function getAuthToken(req: Request): string {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  return authHeader.replace('Bearer ', '');
} 