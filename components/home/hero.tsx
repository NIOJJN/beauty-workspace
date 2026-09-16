'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Clock,
    n: '01',
    title: 'Выберите время',
    text: 'Календарь в стиле Calendly: выделите нужные часы мышкой или пальцем.',
    tint: 'bg-primary/10 text-primary',
  },
  {
    icon: Wallet,
    n: '02',
    title: 'Оплатите онлайн',
    text: 'Почасово, на день или месяц. Скидка считается автоматически.',
    tint: 'bg-accent text-accent-foreground',
  },
  {
    icon: KeyRound,
    n: '03',
    title: 'Получите доступ',
    text: 'Код входа придёт в Telegram сразу после оплаты.',
    tint: 'bg-success/12 text-success',
  },
];

/* Демо-сетка слотов для превью календаря в герое.
   Значения фиксированные, чтобы разметка совпадала при гидрации. */
const PREVIEW_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
const PREVIEW_HOURS = ['10', '12', '14', '16', '18'];
const PREVIEW_STATE: Record<string, 'free' | 'busy' | 'picked'> = {
  '0-0': 'picked',
  '0-1': 'picked',
  '0-2': 'busy',
  '1-0': 'busy',
  '1-3': 'picked',
  '1-4': 'picked',
  '2-1': 'busy',
  '2-2': 'busy',
  '3-0': 'picked',
  '3-1': 'picked',
  '4-2': 'busy',
  '4-3': 'busy',
};

export function Hero() {
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="relative overflow-hidden">
      {/* Пастельная «аврора» на фоне */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-primary/25 blur-3xl animate-aurora" />
        <div
          className="absolute -right-24 top-4 h-[22rem] w-[22rem] rounded-full bg-accent blur-3xl animate-float"
          style={{ animationDelay: '1.6s' }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[18rem] w-[18rem] rounded-full bg-pastel-butter/70 blur-3xl animate-float"
          style={{ animationDelay: '3.2s' }}
        />
      </div>

      <div className="container grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <span className="eyebrow normal-case tracking-normal">
            <Sparkles className="h-3.5 w-3.5" />
            Для парикмахеров, бровистов, мастеров маникюра и визажистов
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-5 max-w-3xl text-balance text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl"
        >
          Выходи за рамки привычного:{' '}
          <span className="text-gradient">бронируй место</span>{' '}
          <span className="relative whitespace-nowrap">
            от 300 ₽ в час
            <svg
              aria-hidden
              viewBox="0 0 300 12"
              className="absolute -bottom-2 left-0 h-2.5 w-full text-primary/40"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8C60 3 120 2 180 5c40 2 80 4 118 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Не снимайте кабинет целиком. Бронируйте кресло, станцию или зал ровно на то время,
          которое нужно, — и платите только за него.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center lg:justify-start"
        >
          <Button size="lg" className="shadow-glow" asChild>
            <Link href="/spaces">
              Выбрать место <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Стать мастером</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium text-muted-foreground lg:justify-start"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> Безопасная оплата
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-warning" /> 4.9 из 5 — оценка мастеров
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Отмена за 2 часа
          </span>
        </motion.div>
        </div>

        {/* Превью бронирования */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-4xl bg-gradient-primary opacity-[0.18] blur-2xl"
          />

          <div className="glass relative rounded-4xl p-5 shadow-float">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold tracking-tight">Парикмахерское кресло №3</p>
                <p className="mt-0.5 text-xs text-muted-foreground">ул. Тверская, 12 · 300 /час</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarCheck className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[auto_repeat(5,1fr)] gap-1.5 text-center">
              <span />
              {PREVIEW_DAYS.map((day) => (
                <span key={day} className="pb-1 text-[11px] font-semibold text-muted-foreground">
                  {day}
                </span>
              ))}

              {PREVIEW_HOURS.map((hour, rowIndex) => (
                <Fragment key={hour}>
                  <span className="flex items-center justify-end pr-1 text-[11px] font-semibold text-muted-foreground">
                    {hour}
                  </span>
                  {PREVIEW_DAYS.map((day, colIndex) => {
                    const state = PREVIEW_STATE[`${colIndex}-${rowIndex}`] ?? 'free';
                    return (
                      <span
                        key={`${day}-${hour}`}
                        className={cn(
                          'h-8 rounded-lg border transition-colors duration-300',
                          state === 'picked' && 'border-transparent bg-gradient-primary shadow-soft',
                          state === 'busy' && 'border-transparent bg-primary/[0.07]',
                          state === 'free' && 'border-primary/15 bg-primary/[0.03]',
                        )}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Чт, 16:00–18:00 · 2 часа</p>
                <p className="text-sm font-bold tracking-tight">600 ₽</p>
              </div>
              <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
                Забронировать
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease }}
            className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3.5 py-2.5 shadow-float backdrop-blur-xl sm:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/12 text-success">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold">Код доступа в Telegram</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="container grid gap-5 pb-16 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={cn(
              'group rounded-3xl border border-border/70 bg-card/80 p-6 shadow-card backdrop-blur-sm transition-all duration-300 ease-soft hover:-translate-y-1.5 hover:shadow-float',
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft transition-transform duration-300 ease-soft group-hover:scale-105',
                  step.tint,
                )}
              >
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground/45">
                {step.n}
              </span>
            </div>
            <div className="mt-5 font-bold tracking-tight">{step.title}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
