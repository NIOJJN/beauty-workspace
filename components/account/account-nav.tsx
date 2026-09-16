'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'Обзор' },
  { href: '/account/bookings', label: 'Мои брони' },
  { href: '/account/documents', label: 'Документы' },
  { href: '/account/favorites', label: 'Избранное' },
  { href: '/account/telegram', label: 'Telegram' },
];

/** Навигация кабинета: сайдбар на десктопе, скролл-полоса на мобильных. */
export function AccountNav({ variant }: { variant: 'sidebar' | 'mobile' }) {
  const pathname = usePathname();

  if (variant === 'mobile') {
    return (
      <nav className="container flex gap-1.5 overflow-x-auto pb-3">
        {NAV.map((item) => {
          const active =
            item.href === '/account'
              ? pathname === '/account'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-soft',
                active
                  ? 'border-primary/25 bg-primary/10 text-primary shadow-soft'
                  : 'border-border/70 text-muted-foreground hover:border-primary/25 hover:text-primary',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === '/account'
            ? pathname === '/account'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ease-soft',
              active
                ? 'bg-primary/10 text-primary shadow-soft'
                : 'text-muted-foreground hover:bg-primary/[0.06] hover:text-primary',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
