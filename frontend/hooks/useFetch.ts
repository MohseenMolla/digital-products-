'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/api';

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError('');
    try { const r = await api.get(url); setData(r.data.data as T); } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [url]);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
