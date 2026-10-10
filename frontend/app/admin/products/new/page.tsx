'use client';
import { EMPTY_PRODUCT, ProductForm } from '@/components/ProductForm';
export default function NewProduct() { return <div className="space-y-4"><h1 className="text-2xl font-bold">New product</h1><ProductForm initial={EMPTY_PRODUCT} /></div>; }
