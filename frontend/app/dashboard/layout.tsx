'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { PageLoader } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); const router = useRouter(); const path = usePathname();
  useEffect(() => { if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`); }, [loading, user, router, path]);
  if (loading || !user) return <PageLoader />;
  const isCourse = /^\/dashboard\/courses\/[^/]+$/.test(path);
  return (
    <div className="container-x py-6 lg:py-10">
      {user.mustChangePassword && <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">You are using a temporary password. <Link href="/dashboard/security" className="font-semibold underline">Change it now</Link>.</div>}
      {isCourse ? children : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]"><aside className="lg:sticky lg:top-24 lg:self-start"><DashboardSidebar /></aside><section className="min-w-0">{children}</section></div>
      )}
    </div>
  );
}
