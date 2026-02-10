import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables!')
    console.error('URL:', supabaseUrl)
    console.error('Key (Exists):', !!supabaseAnonKey)
    // detailed error but don't crash immediately if possible? No, createClient will crash.
    // throw new Error('Missing Supabase Env Vars')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)
