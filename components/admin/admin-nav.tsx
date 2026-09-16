'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/spaces', label: 'Места' },
  { href: '/admin/bookings', label: 'Брони и загрузка' },
  { href: '/admin/masters', label: 'Мастера' },
  { href: '/admin/blocked-slots', label: 'Блокировки' },
];

/** Навигация админки. */
export function AdminNav({ variant }: { variant: 'sidebar' | 'mobile' }) {
  const pathname = usePathname();

  const item = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href);

  if (variant === 'mobile') {
    return (
      <nav className="container flex gap-1.5 overflow-x-auto pb-3">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-soft',
              item(n.href)
                ? 'border-primary/25 bg-primary/10 text-primary shadow-soft'
                : 'border-border/70 text-muted-foreground hover:border-primary/25 hover:text-primary',
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={cn(
            'block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ease-soft',
            item(n.href)
              ? 'bg-primary/10 text-primary shadow-soft'
              : 'text-muted-foreground hover:bg-primary/[0.06] hover:text-primary',
          )}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
