'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/lib/cart';
import { buttonClass, Button } from '@/components/ui/Button';
import { trackAddToCart } from '@/lib/tracking';
import type { Product } from '@/types';

export function BuyBox({ product }: { product: Product }) {
  const { user } = useAuth();
  const cart = useCart();
  const [owned, setOwned] = useState(false);
  useEffect(() => {
    if (!user) { setOwned(false); return; }
    api.get(`/purchases/check/${product.id}`).then((r) => setOwned(Boolean(r.data.data.owned))).catch(() => setOwned(false));
  }, [user, product.id]);

  if (owned) return <Link href={`/dashboard/products/${product.id}`} className={buttonClass('primary', 'lg', 'mt-5 w-full')}>Access Product</Link>;
  if (product.stockStatus === 'OUT_OF_STOCK') return <Button disabled size="lg" className="mt-5 w-full">Currently unavailable</Button>;
  return (
    <div className="mt-5 flex flex-col gap-2">
      <Link href={`/checkout/${product.id}`} className={buttonClass('primary', 'lg', 'w-full')}>Buy Now</Link>
      <Button variant="secondary" size="lg" className="w-full" onClick={() => { trackAddToCart({ id: product.id, name: product.title, price: product.price }); cart.add({ id: product.id, title: product.title, slug: product.slug, price: product.price, thumbnail: product.thumbnail }); }} disabled={cart.has(product.id)}>
        <ShoppingCart className="h-4 w-4" />{cart.has(product.id) ? 'In your cart' : 'Add to Cart'}
      </Button>
    </div>
  );
}
