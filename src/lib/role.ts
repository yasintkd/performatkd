import type { User } from '@supabase/supabase-js'
import type { Role } from './types'

export function getRole(user: User | null): Role | null {
  if (!user) return null
  const meta = user.app_metadata?.role ?? user.user_metadata?.role
  return meta === 'coach' || meta === 'assistant' ? meta : null
}