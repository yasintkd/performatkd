'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { GlobalBottomNav } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.push('/login');
  }, [loading, session, router]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50">Yükleniyor...</div>;
  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 pb-20">
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8">
        {children}
      </main>
      <GlobalBottomNav />
    </div>
  );
}


