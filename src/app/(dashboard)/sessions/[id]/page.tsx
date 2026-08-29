'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { useAuth } from '@/lib/auth'
import { Button, Spinner, EmptyState, Card, Badge } from '@/components/ui'
import { BeepTestInput } from '@/components/BeepTestInput'
import {
  calculateVO2max,
  getLevelSpeed,
  getPerformanceCategory,
  CATEGORY_COLORS,
} from '@/lib/calculations/beep-test'
import { cn } from '@/lib/utils'

const BEEP_TEST_NAME = '20 Metre Mekik Koşusu'

function studentGender(gender?: string): 'female' | 'male' {
  return gender === 'kiz' || gender === 'female' ? 'female' : 'male'
}

export default function SessionDataPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, role } = useAuth()
  const isCoach = role === 'coach'

  const { data, isLoading } = useSWR(`session-${id}`, async () => {
    const { data: s } = await supabase
      .from('test_sessions')
      .select('id, name, session_date, notes, group_id, test_type_id')
      .eq('id', id)
      .single()
    let group = null
    let students: any[] = []
    let results: any[] = []
    let prev: Record<string, any> = {}
    if (s?.group_id) {
      const [g, st, r] = await Promise.all([
        yc.from('training_groups').select('id, name').eq('id', s.group_id).single(),
        yc
          .from('athletes')
          .select('id, first_name, last_name, belt, birth_date, gender')
          .eq('training_group_id', s.group_id)
          .eq('is_active', true)
          .order('first_name'),
        supabase
          .from('test_results')
          .select('student_id, test_type_id, value, notes, session:test_sessions(session_date)')
          .eq('session_id', id),
      ])
      group = g.data
      students = st.data ?? []
      results = (r.data ?? []).filter((x) => !s.test_type_id || x.test_type_id === s.test_type_id)

      if (students.length > 0) {
        // Basitleştirilmiş sorgu
        const { data: r2 } = await supabase
          .from('test_results')
          .select('student_id, test_type_id, value, session:test_sessions(session_date)')
          .in('student_id', students.map(stItem => stItem.id));
        
        console.log('Tüm test sonuçları (filtresiz):', r2);

        // JS tarafında tarih ve test_type_id karşılaştırması
        const currentSessionDate = new Date(s.session_date).getTime();
        const filteredResults = (r2 ?? []).filter(r => {
          const resDate = new Date((r.session as any)?.session_date).getTime();
          return resDate < currentSessionDate && r.test_type_id === s.test_type_id;
        });
        
        console.log('Filtrelenmiş sonuçlar:', filteredResults);
        
        prev = filteredResults.reduce((acc: any, cur: any) => {
          const key = `${cur.student_id}:${cur.test_type_id}`
          // Her zaman en son tarihli olanı (ilk karşılaşan) tutuyoruz çünkü sıralı geliyor
          if (!acc[key]) acc[key] = { value: cur.value, notes: cur.notes, date: (cur.session as any)?.session_date }
          return acc
        }, {})
      }
    }
      console.log('Previous Results:', prev);

    return { session: { ...s, group }, students, results, previousResults: prev }
  })

  const { data: testTypes } = useSWR('test-types', async () => {
    const { data } = await supabase.from('test_types').select('id, name, unit, higher_is_better').order('name')
    return data ?? []
  })

  const activeTest = useMemo(() => {
    if (!data?.session?.test_type_id || !testTypes) return null
    return testTypes.find((t: any) => t.id === data.session.test_type_id) ?? null
  }, [data?.session?.test_type_id, testTypes])

  const [values, setValues] = useState<Record<string, string>>({})
  const [beep, setBeep] = useState<Record<string, { level: string; shuttle: string }>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data?.results) {
      const entries: [string, string][] = []
      const beepEntries: Record<string, { level: string; shuttle: string }> = {}
      const noteEntries: Record<string, string> = {}
      for (const r of data.results) {
        const key = `${r.student_id}:${r.test_type_id}`
        entries.push([key, String(r.value)])
        if (r.notes) {
          try {
            const n = JSON.parse(r.notes)
            if (typeof n.level === 'number' && typeof n.shuttle === 'number') {
              beepEntries[key] = { level: String(n.level), shuttle: String(n.shuttle) }
            }
            if (typeof n.note === 'string') noteEntries[key] = n.note
          } catch {
            noteEntries[key] = r.notes
          }
        }
      }
      setValues(Object.fromEntries(entries))
      setBeep(beepEntries)
      setNotes(noteEntries)
    }
  }, [data?.results])

  function updateBeep(key: string, patch: Partial<{ level: string; shuttle: string }>) {
    const cur = beep[key] ?? { level: '', shuttle: '' }
    const next = { ...cur, ...patch }
    const l = Number(next.level)
    const s = Number(next.shuttle)
    const valid = l >= 1 && s >= 0 && s <= 16
    const vo2max = valid ? String(calculateVO2max(l, s)) : ''

    setBeep((prev) => ({ ...prev, [key]: next }))
    setValues((vals) => ({ ...vals, [key]: vo2max }))
  }

  async function handleDelete() {
    if (!data?.session) return
    if (!confirm(`"${data.session.name}" oturumunu silmek istediğine emin misin?\nTüm test sonuçları da silinecek.`)) return
    const { error } = await supabase.from('test_sessions').delete().eq('id', id)
    if (error) alert(error.message)
    else router.push('/sessions')
  }

  async function handleSave() {
    const results = Object.entries(values)
      .filter(([, v]) => v !== '')
      .map(([key, v]) => {
        const [studentId, testTypeId] = key.split(':')
        const student = data?.students?.find((st: any) => st.id === studentId)
        const b = beep[key]
        const n = notes[key]
        const note = n ? { note: n } : {}
        const notesVal =
          b?.level && b?.shuttle
            ? JSON.stringify({
                level: Number(b.level),
                shuttle: Number(b.shuttle),
                speed: getLevelSpeed(Number(b.level)),
                category: getPerformanceCategory(Number(v), studentGender(student?.gender)),
                ...note,
              })
            : n
              ? n
              : undefined
        return {
          session_id: id,
          student_id: studentId,
          test_type_id: testTypeId,
          value: Number(v),
          created_by: user?.id ?? null,
          ...(notesVal ? { notes: notesVal } : {}),
        }
      })
    if (results.length === 0) return
    const { error } = await supabase.from('test_results').upsert(results, {
      onConflict: 'session_id,student_id,test_type_id',
    })
    if (error) alert(error.message)
    else {
      alert('Kaydedildi!')
      mutate(`session-${id}`)
    }
  }

  const report = useMemo(() => {
    if (!data || !testTypes) return null
    const byTest: Record<string, { name: string; unit: string; values: number[] }> = {}
    for (const t of testTypes) byTest[t.id] = { name: t.name, unit: t.unit, values: [] }
    for (const r of data.results) {
      const entry = byTest[r.test_type_id]
      if (entry) entry.values.push(Number(r.value))
    }
    const stats = Object.values(byTest)
      .filter((t) => t.values.length > 0)
      .map((t) => {
        const sorted = [...t.values].sort((a, b) => a - b)
        const sum = t.values.reduce((a, b) => a + b, 0)
        return {
          ...t,
          avg: Math.round((sum / t.values.length) * 100) / 100,
          best: sorted[sorted.length - 1],
          worst: sorted[0],
          count: t.values.length,
        }
      })

    const catCount: Record<string, number> = {}
    for (const r of data.results) {
      if (!r.notes) continue
      let cat: string | null = null
      try {
        const n = JSON.parse(r.notes)
        if (typeof n.category === 'string') cat = n.category
      } catch {}
      if (cat) catCount[cat] = (catCount[cat] ?? 0) + 1
    }

    function csv() {
      if (!data || !testTypes) return
      const header = ['Öğrenci', 'Test', 'Değer', 'Birim', 'Not']
      const rows = data.results.map((r: any) => {
        const st = data.students.find((s: any) => s.id === r.student_id)
        const tt = testTypes.find((t: any) => t.id === r.test_type_id)
        let note = r.notes ?? ''
        try {
          const n = JSON.parse(note)
          note = typeof n.note === 'string' ? n.note : ''
        } catch {}
        return [
          st ? `${st.first_name} ${st.last_name}` : r.student_id,
          tt?.name ?? r.test_type_id,
          r.value,
          tt?.unit ?? '',
          note,
        ]
      })
      const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`
      const csv = [header, ...rows].map((r) => r.map(esc).join(';')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.session.name}.csv`.replace(/[^\w\u00f6\u00e7\u015f\u0131\u011f\u00fc\u00d6\u00c7\u015e\u0130\u011e\u00dc\s-]+/g, '_')
      a.click()
      URL.revokeObjectURL(url)
    }

    return { stats, catCount, csv }
  }, [data, testTypes])

  if (isLoading) return <Spinner />
  if (!data?.session) return <EmptyState text="Oturum bulunamadı." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.session.name}</h1>
          <p className="text-sm text-gray-500">
            {(data.session as any).group?.name ?? ""} · {data.session.session_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCoach && (
            <Button
              onClick={handleDelete}
              className="!bg-red-600 !text-white"
            >
              Sil
            </Button>
          )}
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </div>

      {report && (report.stats.length > 0 || Object.keys(report.catCount).length > 0) && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Rapor</h2>
            <Button onClick={report.csv}>CSV İndir</Button>
          </div>
          {report.stats.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.stats.map((t) => (
                <div key={t.name} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-semibold">{t.name} ({t.unit})</p>
                  <p>Ortalama: <span className="font-bold">{t.avg}</span></p>
                  <p>En iyi: <span className="font-bold">{t.best}</span> · En düşük: {t.worst}</p>
                  <p className="text-xs text-gray-500">{t.count} sonuç</p>
                </div>
              ))}
            </div>
          )}
          {Object.keys(report.catCount).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(report.catCount).map(([cat, count]) => (
                <span
                  key={cat}
                  className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', CATEGORY_COLORS[cat] ?? 'bg-gray-200 text-gray-700')}
                >
                  {cat}: {count}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {data.students.length === 0 ? (
        <EmptyState text="Bu grupta öğrenci yok." />
      ) : (
        <div className="space-y-3">
          {data.students.map((s) => (
            <Card key={s.id}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{s.first_name} {s.last_name}</p>
                {s.belt && <Badge>{s.belt}</Badge>}
              </div>
              {activeTest && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Yeni Veri Girişi */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-900">Yeni Veri Girişi</h4>
                    {(() => {
                      const t = activeTest
                      const key = `${s.id}:${t.id}`
                      return (
                        <div key={key} className="space-y-3">
                          {t.name === BEEP_TEST_NAME ? (
                            <BeepTestInput
                              id={key}
                              student={s}
                              level={beep[key]?.level ?? ''}
                              shuttle={beep[key]?.shuttle ?? ''}
                              onLevel={(v) => updateBeep(key, { level: v })}
                              onShuttle={(v) => updateBeep(key, { shuttle: v })}
                            />
                          ) : (
                            <input
                              id={key}
                              inputMode="decimal"
                              type="number"
                              placeholder={`${t.name || 'Test Adı'} (${t.unit || 'Birim'})`}
                              value={values[key] ?? ''}
                              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                              className="h-[44px] w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/30 text-base"
                            />
                          )}
                          <input
                            placeholder="Not…"
                            value={notes[key] ?? ''}
                            onChange={(e) => setNotes((n) => ({ ...n, [key]: e.target.value }))}
                            className="h-[44px] w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                          />
                        </div>
                      )
                    })()}
                  </div>

                  {/* Son Ölçüm */}
                  <div className="space-y-3 border-l-0 border-t border-gray-200 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <h4 className="text-sm font-bold text-gray-500">
                      Son Ölçüm {data.previousResults[`${s.id}:${activeTest.id}`] ? `(${new Date(data.previousResults[`${s.id}:${activeTest.id}`].date).toLocaleDateString('tr-TR')})` : ''}
                    </h4>
                    {data.previousResults[`${s.id}:${activeTest.id}`] ? (
                      <div className="space-y-3 opacity-60 pointer-events-none">
                        {activeTest.name === BEEP_TEST_NAME ? (() => {
                          const prev = data.previousResults[`${s.id}:${activeTest.id}`]
                          let pBeep = { l: '-', s: '-', n: '' }
                          try {
                            const parsed = JSON.parse(prev.notes || '{}')
                            pBeep.l = parsed.level !== undefined ? String(parsed.level) : '-'
                            pBeep.s = parsed.shuttle !== undefined ? String(parsed.shuttle) : '-'
                            pBeep.n = parsed.note || ''
                          } catch {
                            pBeep.n = prev.notes || ''
                          }
                          return (
                            <>
                              <div className="flex gap-2">
                                <input className="h-[44px] w-full rounded-lg border bg-gray-100 px-3" value={pBeep.l} readOnly />
                                <input className="h-[44px] w-full rounded-lg border bg-gray-100 px-3" value={pBeep.s} readOnly />
                              </div>
                              <input
                                value={pBeep.n}
                                placeholder="Not bulunmuyor"
                                className="h-[44px] w-full appearance-none rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-base"
                                readOnly
                              />
                            </>
                          )
                        })() : (
                          <>
                            <input
                              className="h-[44px] w-full appearance-none rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-base"
                              value={data.previousResults[`${s.id}:${activeTest.id}`].value || ''}
                              readOnly
                            />
                            <input
                              value={data.previousResults[`${s.id}:${activeTest.id}`].notes || ''}
                              placeholder="Not bulunmuyor"
                              className="h-[44px] w-full appearance-none rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-base"
                              readOnly
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Daha önce veri girilmemiş.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}