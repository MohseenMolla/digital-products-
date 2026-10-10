'use client';
import { useParams } from 'next/navigation';
import { EMPTY_PRODUCT, ProductForm, type ProductFormData } from '@/components/ProductForm';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useFetch } from '@/hooks/useFetch';

type Loaded = Omit<ProductFormData, 'category'> & { id: string; category?: { _id: string } | string | null };

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch<Loaded>(`/admin/products/${id}`);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error} onRetry={reload} />;
  const cat = data.category && typeof data.category === 'object' ? data.category._id : data.category || '';
  const initial: ProductFormData = {
    ...EMPTY_PRODUCT, ...data, category: String(cat),
    images: data.images ?? [], features: data.features ?? [], whatYouGet: data.whatYouGet ?? [], faqs: data.faqs ?? [],
    courseModules: (data.courseModules ?? []).map((m) => ({ ...m, _id: String(m._id), lessons: m.lessons.map((l) => ({ ...l, _id: String(l._id), resources: l.resources ?? [] })) })),
    appCredentials: { ...EMPTY_PRODUCT.appCredentials, ...data.appCredentials, expiresAt: data.appCredentials?.expiresAt ? String(data.appCredentials.expiresAt) : null },
  };
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Edit product</h1><ProductForm initial={initial} id={id} /></div>;
}
