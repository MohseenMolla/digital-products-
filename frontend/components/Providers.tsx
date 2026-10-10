'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>;
}
