import { PurchaseList } from '@/components/PurchaseList';
export default function Page() { return <div className="space-y-4"><h1 className="text-2xl font-bold">Downloads</h1><PurchaseList types={['PDF', 'DIGITAL_PRODUCT', 'OTHER']} emptyText="No downloadable products yet." /></div>; }
