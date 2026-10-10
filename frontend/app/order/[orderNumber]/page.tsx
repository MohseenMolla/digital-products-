'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OrderAccess } from '@/components/OrderAccess';
import { ErrorState, PageLoader } from '@/components/ui/States';

function Inner() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const token = useSearchParams().get('token') ?? '';
  if (!token) return <ErrorState message="This access link is incomplete. Please use the link from your purchase email." />;
  return <OrderAccess orderNumber={orderNumber} token={token} />;
}

export default function OrderAccessPage() {
  return (
    <div className="container-x max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Your purchase</h1>
      <Suspense fallback={<PageLoader />}><Inner /></Suspense>
    </div>
  );
}
