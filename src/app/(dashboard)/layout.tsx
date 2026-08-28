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
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="w-full px-4 md:px-8 py-6">
        {children}
      </main>
      <GlobalBottomNav />
    </div>
  );
}


