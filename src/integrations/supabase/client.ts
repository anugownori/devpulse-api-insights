import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbtoqosnmpstkyumukzs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidG9xb3NubXBzdGt5dW11a3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjk2MDcsImV4cCI6MjA4OTUwNTYwN30.Wir6ms7llE7us4KKqU5Hb_wl301fSfHcKmBPNJnCR_M';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
