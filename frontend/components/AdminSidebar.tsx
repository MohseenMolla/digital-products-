'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, CreditCard, Home, LayoutDashboard, Package, Receipt, Settings, ShieldCheck, Tag, Ticket, Users, FolderTree } from 'lucide-react';
import { cn } from '@/lib/format';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard }, { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: Receipt }, { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/purchases', label: 'Purchases', icon: ShieldCheck }, { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen }, { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket }, { href: '/admin/homepage', label: 'Homepage', icon: Home },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 }, { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      <p className="mb-1 hidden items-center gap-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400 lg:flex"><Tag className="h-3 w-3" />Admin</p>
      {ITEMS.map((i) => {
        const active = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={cn('flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')}><i.icon className="h-4 w-4" />{i.label}</Link>;
      })}
    </nav>
  );
}
