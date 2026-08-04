'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { yc } from '@/lib/yc'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // yc'deki gibi: "yasin" → "yasin@yc-team-tkd.local"
  const toEmail = (u: string) => (u.includes('@') ? u : `${u}@yc-team-tkd.local`)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const email = toEmail(username)

    // 1) Kimlik kaynağı yc: burada hesap yoksa giriş reddedilir
    const { error: ycError } = await yc.auth.signInWithPassword({ email, password })
    if (ycError) {
      setLoading(false)
      setError('Antrenman sistemine giriş başarısız: ' + ycError.message)
      return
    }

    // 2) performatkd: aynı email + şifreyle giriş dene, yoksa otomatik oluştur
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setLoading(false)
        setError('PerformaTKD hesabı oluşturulamadı: ' + signUpError.message)
        return
      }
      const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
      if (retryError) {
        setLoading(false)
        setError('PerformaTKD girişi başarısız: ' + retryError.message)
        return
      }
    }

    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-2xl font-black text-white">
            TK
          </div>
          <h1 className="mt-3 text-xl font-bold text-[var(--color-dark)]">
            PerformaTKD
          </h1>
          <p className="text-sm text-gray-500">Veriyi Vuruşa Dönüştür</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            Kullanıcı adı
          </label>
          <Input
            id="username"
            required
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Şifre
          </label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </Button>

        <p className="text-center text-xs text-gray-400">
          Tek kullanıcı adı + şifre ({'<kullanıcı_adı>@yc-team-tkd.local'} e-postasına çevrilir) — antrenman sistemine giriş yapar, test kayıtları için burada otomatik hesap oluşturur.
        </p>
      </form>
    </main>
  )
}