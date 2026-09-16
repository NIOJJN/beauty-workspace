import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, FileText, Heart, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';
import {
  formatDateLabel,
  formatMoney,
  formatTime,
} from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Личный кабинет' };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [activeBookings, spentAgg, favorites, nextBooking] = await Promise.all([
    db.booking.count({
      where: {
        userId: user.id,
        status: { in: ACTIVE_BOOKING_STATUSES },
        endTime: { gte: new Date() },
      },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCEEDED', booking: { userId: user.id } },
    }),
    db.favorite.count({ where: { userId: user.id } }),
    db.booking.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PAID', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
      include: { space: { select: { id: true, name: true, address: true } } },
      orderBy: { startTime: 'asc' },
    }),
  ]);

  const stats = [
    { icon: CalendarDays, label: 'Активных броней', value: String(activeBookings) },
    {
      icon: Wallet,
      label: 'Всего потрачено',
      value: formatMoney(Number(spentAgg._sum.amount ?? 0)),
    },
    { icon: Heart, label: 'В избранном', value: String(favorites) },
    { icon: FileText, label: 'Статус', value: user.role === 'ADMIN' ? 'Админ' : 'Мастер' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Привет, {user.name?.split(' ')[0] ?? 'мастер'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Ваша рабочая витрина броней и документов
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nextBooking ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ближайшая бронь</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{nextBooking.space.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateLabel(nextBooking.startTime)},{' '}
                  {formatTime(nextBooking.startTime)}–{formatTime(nextBooking.endTime)}
                </div>
                {nextBooking.space.address ? (
                  <div className="text-xs text-muted-foreground">
                    {nextBooking.space.address}
                  </div>
                ) : null}
              </div>
              {nextBooking.accessCode ? (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Код доступа</div>
                  <div className="text-2xl font-bold tracking-[0.2em] text-primary">
                    {nextBooking.accessCode}
                  </div>
                </div>
              ) : (
                <Badge variant="warning">Ожидает оплаты</Badge>
              )}
            </div>
            <Button variant="outline" asChild>
              <Link href="/account/bookings">Все брони</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">
              Нет активных броней — самое время выбрать место под запись
            </p>
            <Button asChild>
              <Link href="/spaces">Выбрать рабочее место</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
