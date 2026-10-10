'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckoutForm } from '@/components/CheckoutForm';
import { buttonClass } from '@/components/ui/Button';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import type { Product } from '@/types';

/** No login required: guests check out with name, email and phone. */
export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const { user, loading } = useAuth();
  const { data: product, loading: pl, error } = useFetch<Product>(`/products/by-id/${productId}`);
  const { data: owned } = useFetch<{ owned: boolean }>(user ? `/purchases/check/${productId}` : null);

  if (loading || pl) return <PageLoader />;
  if (error || !product) return <div className="container-x max-w-xl py-12"><ErrorState message={error || 'Product not found'} /></div>;
  return (
    <div className="container-x max-w-4xl py-8 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
      {!user && <p className="mt-1 text-sm text-slate-500">No account needed. After payment you get your product instantly and by email. Already have an account? <Link href={`/login?next=${encodeURIComponent(`/checkout/${productId}`)}`} className="font-semibold text-brand-700">Log in</Link></p>}
      {owned?.owned ? (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6"><p className="font-semibold">You already own this product.</p><Link href={`/dashboard/products/${product.id}`} className={buttonClass('primary', 'md', 'mt-4')}>Access Product</Link></div>
      ) : <div className="mt-6"><CheckoutForm product={product} /></div>}
    </div>
  );
}
