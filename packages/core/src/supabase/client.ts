import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// These will be replaced with environment variables during build
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables for Supabase');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get the current user's ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
};

// Helper function to get the current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper function to get the current user's profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Helper function to update user preferences
export const updateUserPreferences = async (userId: string, preferences: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ preferences })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Export types for database tables
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Re-export types for easier access
export type { Database } from './database.types';
