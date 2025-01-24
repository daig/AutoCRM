import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
  // Don't log the full key for security
  keyPreview: supabaseAnonKey?.substring(0, 10) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create custom storage that expires after 5 minutes
const customStorage: Storage = {
  length: window.localStorage.length,
  key: (index: number) => window.localStorage.key(index),
  clear: () => window.localStorage.clear(),
  removeItem: (key: string) => window.localStorage.removeItem(key),
  setItem: (key: string, value: string) => {
    // Store the timestamp along with the value
    const item = {
      value,
      timestamp: new Date().getTime(),
      expiresIn: 5 * 60 * 1000 // 5 minutes in milliseconds
    };
    window.localStorage.setItem(key, JSON.stringify(item));
  },
  getItem: (key: string) => {
    const itemStr = window.localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      // Check if the item has expired
      if (now > item.timestamp + item.expiresIn) {
        window.localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (error) {
      // If there's an error parsing the JSON, return the raw value
      // This handles cases where the value wasn't set by our custom storage
      return itemStr;
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    storage: customStorage,
    storageKey: 'autocrm-auth-token',
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
}); 