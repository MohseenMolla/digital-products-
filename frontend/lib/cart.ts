'use client';
import { useCallback, useEffect, useState } from 'react';

export interface CartItem { id: string; title: string; slug: string; price: number; thumbnail: string; }
const KEY = 'dp-cart';

function read(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as CartItem[]; } catch { return []; }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener('dp-cart', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('dp-cart', sync); window.removeEventListener('storage', sync); };
  }, []);
  const save = useCallback((next: CartItem[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setItems(next);
    window.dispatchEvent(new Event('dp-cart'));
  }, []);
  const add = useCallback((i: CartItem) => { const cur = read(); if (!cur.some((c) => c.id === i.id)) save([...cur, i]); }, [save]);
  const remove = useCallback((id: string) => save(read().filter((c) => c.id !== id)), [save]);
  return { items, add, remove, has: (id: string) => items.some((c) => c.id === id) };
}
