import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Тарифы',
};

const TARIFFS = [
  {
    name: 'Почасово',
    price: 'от 300 ₽',
    unit: 'за час',
    features: [
      'Минимальное бронирование — 2 часа',
      'Выбор точных часов в календаре',
      'Отмена за 24ч — возврат 100%',
    ],
  },
  {
    name: 'На день',
    price: 'от 2 000 ₽',
    unit: 'за день',
    highlight: true,
    features: [
      'Место целиком на рабочий день',
      'В среднем на 30% выгоднее почасовой',
      'Скидка до 5% от тарифа',
      'Отмена за 24ч — возврат 100%',
    ],
  },
  {
    name: 'На месяц',
    price: 'от 40 000 ₽',
    unit: 'за месяц',
    features: [
      'Закреплённое место 30 дней',
      'Скидка до 10% от тарифа',
      'Приоритетная поддержка',
      'Отмена за 24ч — возврат 100%',
    ],
  },
];

const FAQ = [
  {
    q: 'Как считается стоимость?',
    a: 'Стоимость = длительность × цена тарифа − скидка. Расчёт показывается в реальном времени при выборе часов в календаре.',
  },
  {
    q: 'Что такое буфер между бронями?',
    a: 'Это 15 минут на уборку и проветривание после каждого мастера. Слот с буфером автоматически остаётся свободным для следующей брони.',
  },
  {
    q: 'Как работает отмена и возврат?',
    a: 'Отмена больше чем за 24 часа до начала — возврат 100%, меньше чем за 24 часа — 50%. Возврат приходит на карту в течение 3–10 дней.',
  },
  {
    q: 'Как получить доступ к месту?',
    a: 'После оплаты 6-значный код доступа приходит в Telegram и виден в личном кабинете. Код действует только на время вашей брони.',
  },
];

export default function PricingPage() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]">
        <div className="absolute left-1/2 top-0 h-[24rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container py-16 md:py-24">
        <div className="text-center">
          <p className="eyebrow">Тарифы</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Выбирайте под свой график
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Час для экспресс-клиента, день для плотной записи или месяц для
            стабильного потока — платите только за реальное время.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TARIFFS.map((tariff) => (
            <Card
              key={tariff.name}
              className={cn(
                'relative transition-all duration-300 ease-soft',
                tariff.highlight
                  ? 'border-primary/40 shadow-glow lg:-translate-y-2 lg:scale-[1.02]'
                  : 'hover:-translate-y-1 hover:shadow-float',
              )}
            >
              {tariff.highlight && (
                <Badge variant="accent" className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-soft">
                  <Sparkles className="h-3 w-3" /> Популярный
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="font-bold">{tariff.name}</CardTitle>
                <div className="pt-1">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {tariff.price}
                  </span>
                  <span className="text-sm text-muted-foreground"> {tariff.unit}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tariff.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-relaxed">{feature}</span>
                  </div>
                ))}
                <Button
                  className="mt-5 w-full"
                  variant={tariff.highlight ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/spaces">Выбрать место</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Частые вопросы</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-soft backdrop-blur-sm transition-all duration-300 open:shadow-card"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold marker:content-none">
                  {item.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
