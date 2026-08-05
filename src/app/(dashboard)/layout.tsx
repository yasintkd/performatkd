'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  DesktopSidebar,
  MobileBottomNav,
  MobileLogoutButton,
} from '@/components/Sidebar'
import { Spinner } from '@/components/ui'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) router.push('/login')
  }, [loading, session, router])

  if (loading || !session) return <Spinner />

  return (
    <div className="min-h-screen">
      <div className="lg:mx-auto lg:flex lg:min-h-screen lg:max-w-7xl">
        <DesktopSidebar />
        <main className="w-full flex-1 p-4 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-4">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <MobileLogoutButton />
    </div>
  )
}
