import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — add them to .env.local and restart the dev server.')
}

/** Requests carry the Clerk session token when signed in; anonymous otherwise. */
export const supabase = createClient(url, key, {
  accessToken: async () => (await window.Clerk?.session?.getToken()) ?? null,
})
