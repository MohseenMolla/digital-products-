'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';

/** UI guard only. Every /api/admin route is independently enforced by authenticate + authorizeAdmin on the backend. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); const router = useRouter();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  useEffect(() => { if (!loading && !user) router.replace('/login?next=/admin'); }, [loading, user, router]);
  if (loading || !user) return <PageLoader />;
  if (!isAdmin) return <div className="container-x max-w-xl py-16"><ErrorState message="You do not have access to the admin area." /></div>;
  return (
    <div className="container-x py-6 lg:py-10"><div className="grid gap-6 lg:grid-cols-[210px_1fr]"><aside className="lg:sticky lg:top-24 lg:self-start"><AdminSidebar /></aside><section className="min-w-0">{children}</section></div></div>
  );
}
