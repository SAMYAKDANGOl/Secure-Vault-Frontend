import { createClient } from "@supabase/supabase-js"

// Use environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eehpwimimrpzszacgxko.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHB3aW1pbXJwenN6YWNneGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MDc2NDksImV4cCI6MjA2Mzk4MzY0OX0.ufRM9WJZLL2l8UW0FxsquADhVZvQBeTJBmpX1TtT398"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
