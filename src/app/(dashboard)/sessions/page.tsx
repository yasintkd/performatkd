'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { Card, Spinner, EmptyState, Badge, Button } from '@/components/ui'

export default function SessionsPage() {
  const router = useRouter()
  const { data, isLoading } = useSWR('sessions', async () => {
    const { data } = await supabase
      .from('test_sessions')
      .select('id, name, session_date, group_id, test_type_id')
      .order('created_at', { ascending: false })
    const sessions = data ?? []
    const ids = Array.from(new Set(sessions.map((s: any) => s.group_id).filter(Boolean)))
    const groupNames: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: groups } = await yc
        .from('training_groups')
        .select('id, name')
        .in('id', ids)
      for (const g of groups ?? []) groupNames[g.id] = g.name
    }
    const testIds = Array.from(new Set(sessions.map((s: any) => s.test_type_id).filter(Boolean)))
    const testNames: Record<string, string> = {}
    if (testIds.length > 0) {
      const { data: tests } = await supabase
        .from('test_types')
        .select('id, name')
        .in('id', testIds)
      for (const t of tests ?? []) testNames[t.id] = t.name
    }
    return sessions.map((s: any) => ({
      ...s,
      group_name: groupNames[s.group_id] ?? null,
      test_name: testNames[s.test_type_id] ?? null,
    }))
  })

  async function handleDelete(s: { id: string; name: string }) {
    if (!confirm(`"${s.name}" oturumunu silmek istediğine emin misin?\nTüm test sonuçları da silinecek.`)) return
    const { error } = await supabase.from('test_sessions').delete().eq('id', s.id)
    if (error) alert(error.message)
    else mutate('sessions')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oturumlar</h1>
        <Link href="/sessions/new">
          <Button>Yeni Oturum</Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState text="Henüz oturum yok." />
      ) : (
        <div className="space-y-3">
          {data.map((s: any) => (
            <Card key={s.id} className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <Link href={`/sessions/${s.id}`} className="min-w-0 flex-1">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-gray-500">
                      {s.group_name ?? '—'} · {s.session_date}
                    </p>
                    {s.test_name && (
                      <p className="text-xs font-medium text-[var(--color-secondary)]">{s.test_name}</p>
                    )}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge>{s.session_date}</Badge>
                  <button
                    onClick={() => router.push(`/sessions/new?edit=${s.id}`)}
                    className="text-sm text-[var(--color-secondary)] hover:underline"
                    aria-label={`${s.name} düzenle`}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="text-sm text-red-600 hover:underline"
                    aria-label={`${s.name} sil`}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}