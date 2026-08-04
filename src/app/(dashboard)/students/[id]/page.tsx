'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { Card, Spinner, EmptyState, Badge } from '@/components/ui'

export default function StudentPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useSWR(`student-${id}`, async () => {
    const [stud, res] = await Promise.all([
      yc.from('athletes').select('id, first_name, belt, training_group_id').eq('id', id).single(),
      supabase
        .from('test_results')
        .select(
          'value, session:test_sessions(session_date), test:test_types(name, unit, higher_is_better)'
        )
        .eq('student_id', id)
        .order('created_at', { ascending: true }),
    ])
    const gRes = stud.data?.training_group_id
      ? await yc
          .from('training_groups')
          .select('name')
          .eq('id', stud.data.training_group_id)
          .single()
      : null
    return {
      student: { ...stud.data, group: gRes?.data ?? null },
      results: res.data ?? [],
    }
  })

  if (isLoading) return <Spinner />
  if (!data?.student) return <EmptyState text="Sporcu bulunamadı." />

  const byTest: Record<string, any> = {}
  for (const r of data.results as any[]) {
    const name = r.test?.name ?? 'Test'
    if (!byTest[name]) {
      byTest[name] = { unit: r.test?.unit, higher_is_better: r.test?.higher_is_better, points: [] }
    }
    byTest[name].points.push({ date: r.session?.session_date, value: Number(r.value) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.student.first_name}</h1>
          <p className="text-sm text-gray-500">{data.student.group?.name}</p>
        </div>
        {data.student.belt && <Badge>{data.student.belt}</Badge>}
      </div>

      {Object.keys(byTest).length === 0 ? (
        <EmptyState text="Bu sporcu için henüz sonuç yok." />
      ) : (
        Object.entries(byTest).map(([name, info]) => {
          const pts = info.points as { date: string; value: number }[]
          const last = pts[pts.length - 1]?.value
          const prev = pts[pts.length - 2]?.value
          const diff = prev !== undefined && last !== undefined ? Number((last - prev).toFixed(2)) : null
          const better = info.higher_is_better
          const improved = diff !== null && ((better && diff > 0) || (!better && diff < 0))
          const unchanged = diff === 0
          return (
            <Card key={name}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">
                  {name} ({info.unit})
                </p>
                {diff !== null && (
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${
                      unchanged
                        ? 'text-gray-500'
                        : improved
                          ? 'text-green-600'
                          : 'text-red-600'
                    }`}
                  >
                    {unchanged ? '→' : improved ? '↑' : '↓'} {Math.abs(diff)} {info.unit}
                  </span>
                )}
              </div>
              {pts.length === 1 ? (
                <p className="text-sm text-gray-500">
                  Tek kayıt: {pts[0].value} {info.unit}
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" stroke="#37474F" fontSize={12} />
                      <YAxis stroke="#37474F" fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#1976D2"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}