import { PurchaseList } from '@/components/PurchaseList';
export default function Page() { return <div className="space-y-4"><h1 className="text-2xl font-bold">My Purchases</h1><PurchaseList mode="table" emptyText="No purchases yet." /></div>; }
