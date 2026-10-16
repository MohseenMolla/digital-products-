'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/tracking';
import type { Product } from '@/types';

export function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.title,
      category: product.category?.name,
      price: product.price,
    });
  }, [product.id, product.title, product.category?.name, product.price]);

  return null;
}

export default ProductViewTracker;
