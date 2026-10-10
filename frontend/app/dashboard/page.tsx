'use client';
import Link from 'next/link';
import { BookOpen, Download, PackageCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { PurchaseList } from '@/components/PurchaseList';
import { StatsCard } from '@/components/ui/StatsCard';
import { ErrorState } from '@/components/ui/States';

interface Summary { totalPurchases: number; activeProducts: number; courses: number; downloads: number; }

export default function Overview() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch<Summary>('/users/summary');
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold">Hi {user?.name.split(' ')[0]}, welcome back</h1><p className="text-sm text-slate-500">Everything you have bought, in one place.</p></div>
      {error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard label="Total Purchases" value={data?.totalPurchases ?? '-'} icon={<ShoppingBag className="h-4 w-4" />} />
          <StatsCard label="Active Products" value={data?.activeProducts ?? '-'} icon={<PackageCheck className="h-4 w-4" />} />
          <StatsCard label="Courses" value={data?.courses ?? '-'} icon={<BookOpen className="h-4 w-4" />} />
          <StatsCard label="Downloads" value={data?.downloads ?? '-'} icon={<Download className="h-4 w-4" />} />
        </div>
      )}
      <div><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Your products</h2><Link href="/dashboard/purchases" className="text-sm font-semibold text-brand-700">View all</Link></div>
        <PurchaseList emptyText="No purchases yet." /></div>
    </div>
  );
}
