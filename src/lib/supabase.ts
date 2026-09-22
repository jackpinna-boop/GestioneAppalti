import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config'

// Supabase's publishable/secret keys are API keys, not user JWTs.
// Keep the publishable key in the apikey header; do not send it as a
// Bearer token. After sign-in, supabase-js will replace Authorization
// with the actual user session JWT.
const fetchWithoutPublishableBearer: typeof fetch = async (input, init = {}) => {
  const headers = new Headers(init.headers)
  const authorization = headers.get('Authorization')
  if (authorization === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`) {
    headers.delete('Authorization')
  }
  return fetch(input, { ...init, headers })
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: fetchWithoutPublishableBearer },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
