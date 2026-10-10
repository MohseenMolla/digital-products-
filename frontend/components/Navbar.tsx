
'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
  X,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/lib/cart';
import { buttonClass } from '@/components/ui/Button';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products?productType=COURSE', label: 'Courses' },
  { href: '/products?productType=PREMIUM_APP', label: 'Premium Apps' },
  { href: '/products?productType=PDF', label: 'PDF & Resources' },
  { href: '/products', label: 'All Products' },
];

export function Navbar({
  siteName,
  logoUrl,
}: {
  siteName: string;
  logoUrl?: string;
}) {
  const { user, loading, logout } = useAuth();
  const { items } = useCart();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAdmin =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const close = () => {
    setOpen(false);
    setMenu(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key and background scroll handling.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Close the account dropdown when clicking outside.
  useEffect(() => {
    if (!menu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest('[data-account-menu]')
      ) {
        setMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      );
    };
  }, [menu]);

  const handleLogout = async () => {
    close();
    await logout();
    router.push('/');
    router.refresh();
  };

  // Render the mobile drawer directly under document.body.
  // This prevents the sticky header's backdrop-filter from
  // restricting the fixed drawer to the header area.
  const mobileDrawer =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Full-screen backdrop */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={close}
              className="absolute inset-0 h-full w-full cursor-default bg-slate-950/55 backdrop-blur-sm"
            />

            {/* Right-side drawer */}
            <aside
              className="absolute inset-y-0 right-0 z-10 flex h-full h-dvh w-[85vw] max-w-sm flex-col overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <Link
                  href="/"
                  onClick={close}
                  className="flex min-w-0 items-center gap-2 text-lg font-extrabold text-brand-900"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
                      <ShoppingBag className="h-5 w-5" />
                    </span>
                  )}

                  <span className="truncate">{siteName}</span>
                </Link>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mt-5 shrink-0">
                <SearchBar className="w-full" />
              </div>

              {/* Navigation links */}
              <nav
                className="mt-5 flex flex-col gap-1"
                aria-label="Mobile navigation links"
              >
                {LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={close}
                    className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Account section */}
              <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-slate-200 pt-5">
                {loading ? (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    Loading account...
                  </p>
                ) : user ? (
                  <>
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-700">
                        <UserIcon className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Your account
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={close}
                      className={buttonClass('secondary', 'lg')}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Dashboard
                    </Link>

                    <Link
                      href="/dashboard/purchases"
                      onClick={close}
                      className={buttonClass('secondary', 'lg')}
                    >
                      My Purchases
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      onClick={close}
                      className={buttonClass('secondary', 'lg')}
                    >
                      Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={close}
                        className={buttonClass('secondary', 'lg')}
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={buttonClass('danger', 'lg')}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={close}
                      className={buttonClass('secondary', 'lg')}
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={close}
                      className={buttonClass('primary', 'lg')}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="container-x flex h-16 w-full items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <Link
            href="/"
            onClick={close}
            className="flex min-w-0 shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-brand-900"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
                <ShoppingBag className="h-4 w-4" />
              </span>
            )}

            <span className="max-w-[145px] truncate sm:max-w-none">
              {siteName}
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            className="ml-2 hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700 xl:px-3"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="ml-auto hidden min-w-0 max-w-72 flex-1 md:block">
            <SearchBar className="w-full" />
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/cart"
              onClick={close}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label={`Shopping cart, ${items.length} item types`}
            >
              <ShoppingCart className="h-5 w-5" />

              {items.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {items.length > 99 ? '99+' : items.length}
                </span>
              )}
            </Link>

            {user && <NotificationBell />}

            {/* Desktop account menu */}
            <div
              data-account-menu
              className="relative hidden items-center gap-2 lg:flex"
            >
              {loading ? null : user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenu((value) => !value)}
                    aria-expanded={menu}
                    aria-haspopup="true"
                    className="flex max-w-36 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-slate-100"
                  >
                    <UserIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {menu && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <Link
                        href="/dashboard"
                        onClick={close}
                        className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        My Dashboard
                      </Link>

                      <Link
                        href="/dashboard/purchases"
                        onClick={close}
                        className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        My Purchases
                      </Link>

                      <Link
                        href="/dashboard/profile"
                        onClick={close}
                        className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50"
                      >
                        Profile
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={close}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                        >
                          Admin Panel
                        </Link>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/login"
                    className={buttonClass('ghost')}
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className={buttonClass('primary')}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Outside the header: true full-screen mobile overlay */}
      {mobileDrawer}
    </>
  );
}
