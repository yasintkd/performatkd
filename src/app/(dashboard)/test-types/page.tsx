'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase'
import { Button, Spinner, EmptyState, Card, Dialog, Input, Label } from '@/components/ui'
import { Pencil, Trash2 } from 'lucide-react'

type TestType = {
  id: string
  name: string
  unit: string
  higher_is_better: boolean
}

export default function TestTypesPage() {
  const { data, isLoading } = useSWR('test-types', async () => {
    const { data } = await supabase.from('test_types').select('*').order('name')
    return (data ?? []) as TestType[]
  })

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [higherIsBetter, setHigherIsBetter] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<TestType | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = { name, unit, higher_is_better: higherIsBetter }
    if (editing) {
      const { error } = await supabase.from('test_types').update(payload).eq('id', editing.id)
      setSaving(false)
      if (error) return setError(error.message)
      setEditing(null)
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from('test_types').insert({
        ...payload,
        created_by: userData.user?.id,
      })
      setSaving(false)
      if (error) return setError(error.message)
    }
    setName('')
    setUnit('')
    setHigherIsBetter(true)
    setOpen(false)
    mutate('test-types')
  }

  function openEdit(t: TestType) {
    setEditing(t)
    setName(t.name)
    setUnit(t.unit)
    setHigherIsBetter(t.higher_is_better)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu test tipini silmek istediğine emin misin?')) return
    const { error } = await supabase.from('test_types').delete().eq('id', id)
    if (error) alert(error.message)
    else mutate('test-types')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Test Tipleri</h1>
        <Button onClick={() => setOpen(true)}>Yeni Test Tipi</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState text="Henüz test tipi yok." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <Card key={t.id} className="relative flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300">
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 text-lg">{t.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono">{t.unit}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${t.higher_is_better ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {t.higher_is_better ? 'Yüksek daha iyi' : 'Düşük daha iyi'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Düzenle"
                  aria-label="Düzenle"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                  aria-label="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Test Tipini Düzenle' : 'Yeni Test Tipi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Test Adı</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Birim</Label>
            <Input id="unit" required placeholder="sn, kg, cm…" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-dark)]">
            <input
              type="checkbox"
              checked={higherIsBetter}
              onChange={(e) => setHigherIsBetter(e.target.checked)}
              className="h-5 w-5"
            />
            Yüksek değer daha iyidir
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Kaydediliyor…' : editing ? 'Güncelle' : 'Ekle'}
          </Button>
        </form>
      </Dialog>
    </div>
  )
}