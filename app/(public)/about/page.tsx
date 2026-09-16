import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck, KeyRound, Sparkles, Sparkle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'О нас',
};

const VALUES = [
  {
    icon: Users,
    title: 'Пространство без лишних расходов',
    text: 'Мастер не платит за пустые часы, не снимает кабинет целиком и не делит выручку с салоном.',
  },
  {
    icon: CalendarCheck,
    title: 'Полное оснащение',
    text: 'Парикмахерские кресла, кабинеты для бровистов и лешмейкеров, маникюрные станции и залы для визажа — всё оборудовано и с прозрачным прайсом.',
  },
  {
    icon: KeyRound,
    title: 'Мгновенный доступ',
    text: 'После оплаты 6-значный код приходит в Telegram, а напоминания — за 24 часа и за час до начала брони.',
  },
  {
    icon: Sparkle,
    title: 'Мы берём быт на себя',
    text: 'Уборка между бронями (буфер 15 минут), техобслуживание оборудования и работа платёжной системы — наша забота.',
  },
];

export default function AboutPage() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem]">
        <div className="absolute left-1/2 top-0 h-[22rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-10 top-24 h-60 w-60 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container max-w-4xl py-16 md:py-24">
        <p className="eyebrow">О нас</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
          О <span className="text-gradient">BeautyWorkspace</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Мы создали пространство, где бьюти-мастер работает без лишних расходов и
          занимается только любимым делом — клиентами.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="group rounded-3xl border border-border/70 bg-card/80 p-6 shadow-card backdrop-blur-sm transition-all duration-300 ease-soft hover:-translate-y-1.5 hover:shadow-float"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft transition-transform duration-300 ease-soft group-hover:scale-105">
                <value.icon className="h-5 w-5" />
              </span>
              <div className="mt-5 font-bold tracking-tight">{value.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-5 rounded-4xl border border-border/70 bg-gradient-soft p-8 shadow-card sm:flex-row sm:items-center sm:justify-between md:p-10">
          <div>
            <p className="flex items-center gap-2 font-bold tracking-tight">
              <Sparkles className="h-4 w-4 text-primary" /> Готовы начать?
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Выберите ближайшее место и забронируйте удобные часы за пару минут.
            </p>
          </div>
          <Button size="lg" className="shrink-0 shadow-glow" asChild>
            <Link href="/spaces">Посмотреть рабочие места</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
