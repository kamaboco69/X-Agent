import { createClient } from '@supabase/supabase-js'

// Server-only admin client (service role key — never expose to browser).
// Created lazily inside the function so the module can be imported during
// build/page-data collection without requiring env vars at import time.
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}
