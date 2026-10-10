import { PurchaseList } from '@/components/PurchaseList';
export default function Page() { return <div className="space-y-4"><h1 className="text-2xl font-bold">My PDFs</h1><PurchaseList types={['PDF']} emptyText="No PDFs yet." /></div>; }
