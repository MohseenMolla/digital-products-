'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieConsent } from '@/components/CookieConsent';

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider><AuthProvider>{children}<CookieConsent /></AuthProvider></ToastProvider>;
}
