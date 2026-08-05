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

export function DesktopSidebar() {
  const { items, isActive, logout } = useNavItems()

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-white shadow-lg lg:flex">
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] font-black text-white">
            TK
          </div>
          <div>
            <p className="font-bold text-[var(--color-dark)]">PerformaTKD</p>
            <p className="text-xs text-gray-500">Veriyi Vuruşa Dönüştür</p>
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                isActive(href)
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-auto flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}

export function MobileBottomNav() {
  const { items, isActive } = useNavItems()
  const cols = items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <nav
      className={cn('fixed inset-x-0 bottom-0 z-40 grid border-t border-gray-200 bg-white lg:hidden', cols)}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(64px + env(safe-area-inset-bottom))',
      }}
      aria-label="Ana navigasyon"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-[11px] font-medium',
              active ? 'text-[var(--color-primary)]' : 'text-gray-500'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileLogoutButton() {
  const { logout } = useNavItems()

  return (
    <button
      onClick={logout}
      className="fixed right-4 z-40 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 lg:hidden"
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      aria-label="Çıkış Yap"
    >
      <LogOut size={20} />
    </button>
  )
}
