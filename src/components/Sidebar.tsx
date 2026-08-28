'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, ClipboardCheck, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/groups', label: 'Gruplar', icon: Users },
  { href: '/sessions', label: 'Oturumlar', icon: ClipboardList },
  { href: '/test-types', label: 'Test Tipleri', icon: ClipboardCheck },
]

function useNavItems() {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useAuth()

  const items = role === 'coach' ? nav : nav.filter((n) => n.href !== '/test-types')
  const isActive = (href: string) => pathname.startsWith(href)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { items, isActive, logout }
}

export function GlobalBottomNav() {
  const { items, isActive, logout } = useNavItems()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/80 backdrop-blur-md"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Ana navigasyon"
    >
      <div className="max-w-md lg:max-w-2xl mx-auto flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors p-2 rounded-xl',
                active ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors p-2 rounded-xl"
        >
          <LogOut size={20} />
          <span>Çıkış</span>
        </button>
      </div>
    </nav>
  )
}


