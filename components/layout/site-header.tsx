'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn, getInitials } from '@/lib/utils';

export interface HeaderUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: 'MASTER' | 'ADMIN';
}

const NAV = [
  { href: '/spaces', label: 'Рабочие места' },
  { href: '/pricing', label: 'Тарифы' },
  { href: '/about', label: 'О нас' },
];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-extrabold tracking-tight"
          >
            <span className="icon-gradient flex h-9 w-9 items-center justify-center rounded-2xl shadow-soft transition-transform duration-300 ease-soft group-hover:rotate-3 group-hover:scale-105">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">
              Beauty<span className="text-gradient">Workspace</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-300 ease-soft hover:text-primary',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-3.5 bottom-0.5 h-0.5 rounded-full bg-gradient-primary transition-all duration-300 ease-soft',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full p-0.5 ring-primary/40 transition-all duration-300 hover:ring-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Меню пользователя"
                >
                  <Avatar className="h-9 w-9 shadow-soft">
                    {user.image ? <AvatarImage src={user.image} alt={user.name ?? ''} /> : null}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate">{user.name}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/account')}>
                  <UserRound /> Личный кабинет
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <LayoutDashboard /> Админка
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Меню"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/60 bg-card/95 backdrop-blur-xl md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/[0.06] hover:text-primary',
                )}
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-primary/[0.06] hover:text-primary"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-soft"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
