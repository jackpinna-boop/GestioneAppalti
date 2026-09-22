const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url) throw new Error('Missing VITE_SUPABASE_URL')
if (!key) throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY')

export const SUPABASE_URL = url
export const SUPABASE_PUBLISHABLE_KEY = key
