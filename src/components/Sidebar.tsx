'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, Gauge, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/groups', label: 'Gruplar', icon: Users },
  { href: '/sessions', label: 'Oturumlar', icon: ClipboardList },
  { href: '/test-types', label: 'Test Tipleri', icon: Gauge },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useAuth()
  const [open, setOpen] = useState(false)

  const items = role === 'coach' ? nav : nav.filter((n) => n.href !== '/test-types')

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow sm:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Menü"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform sm:static sm:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
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
                onClick={() => setOpen(false)}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  pathname.startsWith(href)
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
    </>
  )
}