'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

interface N { _id: string; title: string; message: string; link: string; read: boolean; createdAt: string; }

export function NotificationBell() {
  const [data, setData] = useState<{ items: N[]; unread: number }>({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const load = () => api.get('/notifications').then((r) => setData(r.data.data)).catch(() => undefined);
  useEffect(() => { void load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {data.unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1"><span className="text-sm font-semibold">Notifications</span>
            {data.unread > 0 && <button className="text-xs text-brand-700" onClick={async () => { await api.post('/notifications/read-all'); await load(); }}>Mark all read</button>}</div>
          <div className="max-h-80 overflow-y-auto">
            {data.items.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications</p>}
            {data.items.map((n) => (
              <Link key={n._id} href={n.link || '#'} onClick={async () => { setOpen(false); if (!n.read) { await api.patch(`/notifications/${n._id}/read`); await load(); } }} className={`block rounded-lg px-3 py-2 hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/60'}`}>
                <p className="text-sm font-medium">{n.title}</p><p className="text-xs text-slate-500">{n.message}</p><p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
