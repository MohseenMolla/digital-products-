import { PurchaseList } from '@/components/PurchaseList';
export default function Page() { return <div className="space-y-4"><h1 className="text-2xl font-bold">My Courses</h1><PurchaseList types={['COURSE']} emptyText="You have not enrolled in any course yet." /></div>; }
