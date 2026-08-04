'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { yc } from '@/lib/yc'
import type { Group } from '@/lib/types'
import { Card, Spinner, EmptyState } from '@/components/ui'

export default function GroupsPage() {
  const { data, isLoading } = useSWR<Group[]>('yc-groups', async () => {
    const { data } = await yc
      .from('training_groups')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name')
    return data ?? []
  })

  if (isLoading) return <Spinner />
  if (!data || data.length === 0)
    return <EmptyState text="Henüz grup yok." />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gruplar</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((g) => (
          <Link key={g.id} href={`/groups/${g.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <p className="font-semibold">{g.name}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}