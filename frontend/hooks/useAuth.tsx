'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (d: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => Promise<User>;
  logout: () => Promise<void>; refresh: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { const r = await api.get('/auth/me'); setUser(r.data.data); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<AuthCtx>(() => ({
    user, loading, refresh,
    login: async (email, password) => { const r = await api.post('/auth/login', { email, password }); setUser(r.data.data); return r.data.data as User; },
    register: async (d) => { const r = await api.post('/auth/register', d); setUser(r.data.data); return r.data.data as User; },
    logout: async () => { try { await api.post('/auth/logout'); } finally { setUser(null); } },
  }), [user, loading, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
