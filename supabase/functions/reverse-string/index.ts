// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this Deno style guide: https://deno.land/manual/contributing/style_guide
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCorsPreflightRequest, 
  createSuccessResponse, 
  createErrorResponse 
} from "../_shared/cors.ts"

console.log("Hello from Functions!")

interface WordStats {
  word: string;
  length: number;
  vowels: number;
  consonants: number;
}

interface TextAnalysis {
  original: string;
  reversed: string;
  stats: {
    totalLength: number;
    wordCount: number;
    uniqueWords: number;
    longestWord: WordStats;
    shortestWord: WordStats;
    averageWordLength: number;
    words: WordStats[];
  };
  metadata: {
    analyzedAt: string;
    processingTimeMs: number;
  };
}

function analyzeWord(word: string): WordStats {
  const vowels = (word.match(/[aeiou]/gi) || []).length;
  return {
    word,
    length: word.length,
    vowels,
    consonants: word.length - vowels
  };
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

    // Split into words and clean them
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Analyze each word
    const wordStats = words.map(analyzeWord);

    // Find longest and shortest words
    const longestWord = [...wordStats].sort((a, b) => b.length - a.length)[0];
    const shortestWord = [...wordStats].sort((a, b) => a.length - b.length)[0];

    const response: TextAnalysis = {
      original: text,
      reversed: text.split('').reverse().join(''),
      stats: {
        totalLength: text.length,
        wordCount: words.length,
        uniqueWords: new Set(words).size,
        longestWord,
        shortestWord,
        averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
        words: wordStats
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        processingTimeMs: Math.round(performance.now() - startTime)
      }
    };

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/reverse-string' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
