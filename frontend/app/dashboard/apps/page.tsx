import { PurchaseList } from '@/components/PurchaseList';
export default function Page() { return <div className="space-y-4"><h1 className="text-2xl font-bold">Premium Apps</h1><PurchaseList types={['PREMIUM_APP', 'SUBSCRIPTION']} emptyText="No premium apps yet." /></div>; }
