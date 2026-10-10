'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Download, FileText, LayoutDashboard, Lock, ShoppingBag, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/format';

const ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/purchases', label: 'My Purchases', icon: ShoppingBag },
  { href: '/dashboard/courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/pdfs', label: 'My PDFs', icon: FileText },
  { href: '/dashboard/apps', label: 'Premium Apps', icon: Sparkles },
  { href: '/dashboard/downloads', label: 'Downloads', icon: Download },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/security', label: 'Security', icon: Lock },
];

export function DashboardSidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {ITEMS.map((i) => {
        const active = i.href === '/dashboard' ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={cn('flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')}>
            <i.icon className="h-4 w-4" />{i.label}
          </Link>
        );
      })}
    </nav>
  );
}
