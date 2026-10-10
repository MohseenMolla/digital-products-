'use client';
import Link from 'next/link';
import { BookOpen, CreditCard, Package, Receipt, TrendingUp, Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { BarChart } from '@/components/MiniChart';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { StatsCard } from '@/components/ui/StatsCard';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT, formatDate } from '@/lib/format';
import type { OrderRow } from '@/types';

export interface Stats {
  totals: { totalRevenue: number; todayRevenue: number; monthRevenue: number; totalOrders: number; paidOrders: number; pendingOrders: number; failedPayments: number; totalUsers: number; totalProducts: number; totalCourses: number; conversion: number };
  revenueByDay: { date: string; revenue: number; orders: number }[]; topProducts: { title: string; sales: number; revenue: number }[];
  paymentMethods: { method: string; count: number }[]; recentOrders: OrderRow[];
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch<Stats>('/admin/stats');
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error || 'Could not load stats'} onRetry={reload} />;
  const t = data.totals; const i = 'h-4 w-4';
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Total Revenue" value={formatBDT(t.totalRevenue)} icon={<TrendingUp className={i} />} />
        <StatsCard label="Today's Revenue" value={formatBDT(t.todayRevenue)} icon={<TrendingUp className={i} />} />
        <StatsCard label="Monthly Revenue" value={formatBDT(t.monthRevenue)} icon={<TrendingUp className={i} />} />
        <StatsCard label="Total Orders" value={t.totalOrders} icon={<Receipt className={i} />} hint={`${t.conversion}% paid`} />
        <StatsCard label="Paid Orders" value={t.paidOrders} icon={<CheckCircle2 className={i} />} />
        <StatsCard label="Pending Orders" value={t.pendingOrders} icon={<Clock className={i} />} />
        <StatsCard label="Failed Payments" value={t.failedPayments} icon={<AlertTriangle className={i} />} />
        <StatsCard label="Total Users" value={t.totalUsers} icon={<Users className={i} />} />
        <StatsCard label="Total Products" value={t.totalProducts} icon={<Package className={i} />} />
        <StatsCard label="Total Courses" value={t.totalCourses} icon={<BookOpen className={i} />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-6 font-semibold">Revenue by day (30d)</p><BarChart data={data.revenueByDay.map((d) => ({ label: d.date, value: d.revenue }))} format={formatBDT} /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-6 font-semibold">Orders by day (30d)</p><BarChart data={data.revenueByDay.map((d) => ({ label: d.date, value: d.orders }))} /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 font-semibold">Top products</p>
          {data.topProducts.length === 0 ? <p className="text-sm text-slate-500">No sales yet</p> : <ul className="space-y-2 text-sm">{data.topProducts.map((p) => <li key={p.title} className="flex justify-between gap-3"><span className="truncate">{p.title}</span><span className="shrink-0 text-slate-500">{p.sales} · {formatBDT(p.revenue)}</span></li>)}</ul>}</div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 font-semibold">Payment methods</p>
          {data.paymentMethods.length === 0 ? <p className="text-sm text-slate-500">No payments yet</p> : <ul className="space-y-2 text-sm">{data.paymentMethods.map((m) => <li key={m.method} className="flex justify-between"><span>{m.method}</span><span className="text-slate-500">{m.count}</span></li>)}</ul>}</div>
      </div>
      <div><div className="mb-3 flex justify-between"><h2 className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-sm font-semibold text-brand-700">View all</Link></div>
        <DataTable rows={data.recentOrders} rowKey={(o) => o._id} empty="No orders yet" columns={[
          { header: 'Order', cell: (o) => <Link className="font-medium text-brand-700" href={`/admin/orders/${o._id}`}>{o.orderNumber}</Link> },
          { header: 'Customer', cell: (o) => o.customerName }, { header: 'Amount', cell: (o) => formatBDT(o.amount) },
          { header: 'Status', cell: (o) => <StatusBadge status={o.paymentStatus} /> }, { header: 'Date', cell: (o) => formatDate(o.createdAt) },
        ]} /></div>
    </div>
  );
}
