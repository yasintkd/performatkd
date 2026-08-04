'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { Button, Input, Label, Select, Spinner, Textarea } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export default function NewSessionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [groupId, setGroupId] = useState('')
  const [testTypeId, setTestTypeId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = Boolean(editId)

  const { data: groups, isLoading } = useSWR('yc-groups', async () => {
    const { data } = await yc.from('training_groups').select('id, name').eq('is_active', true).order('name')
    return data ?? []
  })

  const { data: editSession, isLoading: editLoading } = useSWR(
    editId ? `session-edit-${editId}` : null,
    async () => {
      const { data } = await supabase
        .from('test_sessions')
        .select('id, name, session_date, group_id, test_type_id, notes')
        .eq('id', editId)
        .single()
      return data
    }
  )

  const { data: testTypes } = useSWR('test-types', async () => {
    const { data } = await supabase.from('test_types').select('id, name').order('name')
    return data ?? []
  })

  useEffect(() => {
    if (editSession) {
      setName(editSession.name ?? '')
      setSessionDate(editSession.session_date ?? '')
      setGroupId(editSession.group_id ?? '')
      setTestTypeId(editSession.test_type_id ?? '')
      setNotes(editSession.notes ?? '')
    }
  }, [editSession])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId) {
      setError('Grup seçmelisin.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      name,
      session_date: sessionDate || new Date().toISOString().slice(0, 10),
      group_id: groupId,
      test_type_id: testTypeId || null,
      notes: notes || null,
    }
    const { data, error } = isEdit
      ? await supabase.from('test_sessions').update(payload).eq('id', editId).select().single()
      : await supabase
          .from('test_sessions')
          .insert({ ...payload, created_by: user?.id })
          .select()
          .single()
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push(`/sessions/${data.id}`)
    router.refresh()
  }

  if (isLoading || (isEdit && editLoading)) return <Spinner />

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? 'Oturumu Düzenle' : 'Yeni Oturum'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="space-y-2">
          <Label htmlFor="name">Oturum Adı</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Tarih</Label>
          <Input id="date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="group">Grup</Label>
          <Select id="group" required value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Grup seç…</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="testType">Test Tipi</Label>
          <Select id="testType" required value={testTypeId} onChange={(e) => setTestTypeId(e.target.value)}>
            <option value="">Test tipi seç…</option>
            {testTypes?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
        </Button>
      </form>
    </div>
  )
}