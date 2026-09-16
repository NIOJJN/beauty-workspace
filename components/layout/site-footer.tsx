import Link from 'next/link';
import { Heart, Scissors, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NAV = [
  { href: '/spaces', label: 'Рабочие места' },
  { href: '/pricing', label: 'Тарифы' },
  { href: '/about', label: 'О нас' },
];

const MASTER = [
  { href: '/register', label: 'Регистрация' },
  { href: '/login', label: 'Вход' },
  { href: '/account', label: 'Личный кабинет' },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border/60 bg-gradient-to-b from-card/60 via-primary/[0.05] to-accent/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-accent/40 blur-3xl"
      />

      <div className="container relative grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-extrabold tracking-tight"
          >
            <span className="icon-gradient flex h-9 w-9 items-center justify-center rounded-2xl shadow-soft">
              <Scissors className="h-4 w-4" />
            </span>
            <span>
              Beauty<span className="text-gradient">Workspace</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Аренда рабочих мест для бьюти-мастеров: кресла, кабинеты, станции и залы.
            Час, день или месяц — вы выбираете.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="soft">
              <Sparkles className="h-3 w-3" /> Онлайн-оплата
            </Badge>
            <Badge variant="accent">Поддержка 24/7</Badge>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Навигация
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-foreground/70 transition-colors duration-200 hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Мастерам
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {MASTER.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-foreground/70 transition-colors duration-200 hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-border/60 py-5">
        <div className="container flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BeautyWorkspace. Все права защищены.</p>
          <p className="flex items-center gap-1.5">
            Сделано с
            <Heart className="h-3.5 w-3.5 fill-primary/25 text-primary" />
            для бьюти-профессионалов
          </p>
        </div>
      </div>
    </footer>
  );
}
