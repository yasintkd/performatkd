'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { Card, Spinner, EmptyState, Badge } from '@/components/ui'

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useSWR(`group-${id}`, async () => {
    const [g, s] = await Promise.all([
      yc.from('training_groups').select('id, name').eq('id', id).single(),
      yc
        .from('athletes')
        .select('id, first_name, belt, is_active')
        .eq('training_group_id', id)
        .eq('is_active', true)
        .order('first_name'),
    ])
    const students = s.data ?? []
    const results = students.length
      ? await supabase
          .from('test_results')
          .select(
            'student_id, value, created_at, session:test_sessions(session_date), test:test_types(name, unit, higher_is_better)'
          )
          .in('student_id', students.map((st: any) => st.id))
      : { data: [] }
    const sorted = [...(results.data ?? [])].sort((a: any, b: any) => {
      const d = (a.session?.session_date ?? '').localeCompare(b.session?.session_date ?? '')
      return d !== 0 ? d : (a.created_at ?? '').localeCompare(b.created_at ?? '')
    })
    return { group: g.data, students, results: sorted }
  })

  if (isLoading) return <Spinner />
  if (!data?.group) return <EmptyState text="Grup bulunamadı." />

  const byTest: Record<string, any> = {}
  for (const r of data.results as any[]) {
    const testName = r.test?.name ?? 'Test'
    if (!byTest[testName]) {
      byTest[testName] = { unit: r.test?.unit, higher_is_better: r.test?.higher_is_better, rows: {} as Record<string, { last: number | null; prev: number | null }> }
    }
    const t = byTest[testName]
    const row = t.rows[r.student_id] ?? { last: null, prev: null }
    if (row.last === null) {
      row.last = Number(r.value)
    } else {
      row.prev = row.last
      row.last = Number(r.value)
    }
    t.rows[r.student_id] = row
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data.group.name}</h1>
      {data.students.length === 0 && (
        <EmptyState text="Bu grupta öğrenci yok." />
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.students.map((s: any) => (
          <Link key={s.id} href={`/students/${s.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{s.first_name}</p>
                {s.belt && <Badge>{s.belt}</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {Object.keys(byTest).length === 0 ? (
        <Card>
          <EmptyState text="Bu grupta henüz test sonucu yok." />
        </Card>
      ) : (
        Object.entries(byTest).map(([testName, t]) => (
          <Card key={testName}>
            <p className="mb-2 font-semibold">
              {testName} ({t.unit})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Sporcu</th>
                    <th className="py-2 pr-4 font-medium">Son</th>
                    <th className="py-2 pr-4 font-medium">Önceki</th>
                    <th className="py-2 font-medium">Gelişim</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.students as any[]).map((s) => {
                    const row = t.rows[s.id]
                    if (!row) return null
                    const diff =
                      row.last !== null && row.prev !== null
                        ? Number((row.last - row.prev).toFixed(2))
                        : null
                    const improved =
                      diff !== null &&
                      ((t.higher_is_better && diff > 0) || (!t.higher_is_better && diff < 0))
                    return (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link href={`/students/${s.id}`} className="font-medium hover:underline">
                            {s.first_name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{row.last}</td>
                        <td className="py-2 pr-4">{row.prev ?? '—'}</td>
                        <td className="py-2">
                          {diff === null ? (
                            <span className="text-gray-400">tek kayıt</span>
                          ) : diff === 0 ? (
                            <span className="text-gray-500">→ 0</span>
                          ) : improved ? (
                            <span className="text-green-600">↑ {diff}</span>
                          ) : (
                            <span className="text-red-600">↓ {Math.abs(diff)}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
