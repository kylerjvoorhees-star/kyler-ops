import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singletons — initialized on first use, not at module load time.
// This prevents "supabaseUrl is required" errors during Next.js static build phase.

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _supabase = createClient(url, key)
  }
  return _supabase
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Legacy named exports for backward compatibility — these are module-level
// but use safe fallbacks so the build never throws.
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()) },
} as unknown as SupabaseClient

export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()) },
} as unknown as SupabaseClient
