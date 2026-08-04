'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
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
    <div className="mx-auto flex min-h-screen max-w-7xl">
      <Sidebar />
      <main className="flex-1 p-4 pb-24 pt-16 sm:pb-4 sm:pt-4">
        {children}
      </main>
    </div>
  )
}