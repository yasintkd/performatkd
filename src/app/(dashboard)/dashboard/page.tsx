'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { StatCard, Card, Spinner, EmptyState, Badge, Button } from '@/components/ui'

export default function DashboardPage() {
  const { data, isLoading } = useSWR('dashboard', async () => {
    const [groups, sessions, students, results] = await Promise.all([
      yc.from('training_groups').select('id').eq('is_active', true),
      supabase
        .from('test_sessions')
        .select('id, name, session_date, group_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      yc.from('athletes').select('id').eq('is_active', true),
      supabase.from('test_results').select('id'),
    ])
    const recent = (sessions.data ?? []) as any[]
    const ids = Array.from(new Set(recent.map((s) => s.group_id).filter(Boolean)))
    const groupNames: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: gs } = await yc
        .from('training_groups')
        .select('id, name')
        .in('id', ids)
      for (const g of gs ?? []) groupNames[g.id] = g.name
    }
    return {
      groupCount: groups.data?.length ?? 0,
      studentCount: students.data?.length ?? 0,
      resultCount: results.data?.length ?? 0,
      sessionCount: recent.length,
      recent: recent.map((s) => ({ ...s, group: { name: groupNames[s.group_id] ?? null } })),
    }
  })

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Grup" value={data?.groupCount ?? 0} />
        <StatCard label="Öğrenci" value={data?.studentCount ?? 0} />
        <StatCard label="Oturum" value={data?.sessionCount ?? 0} />
        <StatCard label="Sonuç" value={data?.resultCount ?? 0} />
      </div>

      <section className="rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Test Girişi</h2>
            <p className="text-sm text-gray-500">
              Oturum seçip öğrenci test sonuçlarını gir.
            </p>
          </div>
          <Link href="/sessions/new">
            <Button>Yeni Oturum</Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Son Oturumlar</h2>
          <Link
            href="/sessions"
            className="min-h-[44px] inline-flex items-center text-sm font-medium text-[var(--color-secondary)]"
          >
            Tümü →
          </Link>
        </div>

        {data && data.recent.length === 0 ? (
          <EmptyState text="Henüz oturum yok. İlk oturumu oluştur." />
        ) : (
          <div className="space-y-3">
            {data?.recent.map((s: any) => (
              <div key={s.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-gray-500">
                        {s.group?.name ?? '—'} · {s.session_date}
                      </p>
                    </div>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Test Gir
                    </Link>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}