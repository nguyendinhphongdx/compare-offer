import { createClient } from '@/lib/supabase/server'

/** Get current user's supabaseId from session. Returns null if not logged in. */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
