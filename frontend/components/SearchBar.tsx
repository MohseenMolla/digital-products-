'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBar({ initial = '', className = '' }: { initial?: string; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form role="search" className={`relative ${className}`} onSubmit={(e) => { e.preventDefault(); router.push(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." aria-label="Search products" className="h-10 w-full rounded-full border border-slate-300 bg-white pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
    </form>
  );
}
