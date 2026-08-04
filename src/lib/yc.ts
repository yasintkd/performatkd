import { createClient } from '@supabase/supabase-js'

const ycUrl = process.env.NEXT_PUBLIC_YC_URL!
const ycAnonKey = process.env.NEXT_PUBLIC_YC_ANON_KEY!

export const yc = createClient(ycUrl, ycAnonKey)