import type { Metadata } from 'next';
import { subDays, differenceInMinutes, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { db } from '@/lib/db';
import { toBookingDto } from '@/lib/dto';
import { formatMoney, formatPeriod } from '@/lib/utils';
import { BOOKING_STATUS_LABELS } from '@/lib/constants';
import { OccupancyHeatmap, type HeatmapData } from '@/components/admin/heatmap';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Админка' };

export default async function AdminDashboardPage() {
  const since = subDays(new Date(), 30);

  const [revenue, bookingsCount, spaces, topGroups, recent] =
    await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCEEDED' },
      }),
      db.booking.count({
        where: { status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
      }),
      db.space.findMany({
        where: { isActive: true },
        include: {
          schedules: true,
          bookings: {
            where: {
              status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
              startTime: { gte: since },
            },
            select: { startTime: true, endTime: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.booking.groupBy({
        by: ['userId'],
        _sum: { totalPrice: true },
        _count: { _all: true },
        where: { status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      db.booking.findMany({
        include: {
          user: { select: { name: true } },
          space: {
            select: { id: true, name: true, type: true, photos: true, address: true },
          },
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

  // Загрузка мест за 30 дней
  let bookedMinutes = 0;
  let availableMinutes = 0;

  for (const space of spaces) {
    for (const booking of space.bookings) {
      bookedMinutes += differenceInMinutes(booking.endTime, booking.startTime);
    }
    for (let i = 0; i < 30; i++) {
      const day = subDays(new Date(), i);
      const schedule = space.schedules.find((s) => s.dayOfWeek === day.getDay());
      if (!schedule || schedule.isClosed) continue;
      const [openH, openM] = schedule.openTime.split(':').map(Number);
      const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
      availableMinutes +=
        (closeH ?? 0) * 60 + (closeM ?? 0) - ((openH ?? 0) * 60 + (openM ?? 0));
    }
  }
  const utilization =
    availableMinutes > 0
      ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100))
      : 0;

  // Топ мастеров
  const topUserIds = topGroups.map((g) => g.userId);
  const topUsers = await db.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, specialization: true },
  });

  // Heatmap за текущий месяц
  const now = new Date();
  const monthDays: string[] = [];
  for (
    let d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.getMonth() === now.getMonth();
    d.setDate(d.getDate() + 1)
  ) {
    monthDays.push(format(d, 'yyyy-MM-dd'));
  }

  const heatmap: HeatmapData = {
    spaces: spaces.map((s) => ({ id: s.id, name: s.name })),
    days: monthDays,
    values: spaces.map((space) =>
      monthDays.map((day) => {
        const date = new Date(`${day}T12:00:00`);
        const schedule = space.schedules.find(
          (s) => s.dayOfWeek === date.getDay(),
        );
        if (!schedule || schedule.isClosed) return 0;
        const [openH, openM] = schedule.openTime.split(':').map(Number);
        const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
        const available =
          (closeH ?? 21) * 60 +
          (closeM ?? 0) -
          ((openH ?? 9) * 60 + (openM ?? 0));
        if (available <= 0) return 0;
        const booked = space.bookings
          .filter((b) => format(b.startTime, 'yyyy-MM-dd') === day)
          .reduce(
            (sum, b) => sum + differenceInMinutes(b.endTime, b.startTime),
            0,
          );
        return Math.min(1, booked / available);
      }),
    ),
  };

  const stats = [
    { label: 'Выручка (все оплаты)', value: formatMoney(Number(revenue._sum.amount ?? 0)) },
    { label: 'Броней оплачено', value: String(bookingsCount) },
    { label: 'Загрузка мест (30 дн.)', value: `${utilization}%` },
    { label: 'Активных мест', value: String(spaces.length) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-sm text-muted-foreground">
          Показатели площадки за последние 30 дней
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Загрузка мест — {format(new Date(), 'LLLL', { locale: ru })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OccupancyHeatmap data={heatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Топ мастеров</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topGroups.map((group, index) => {
              const user = topUsers.find((u) => u.id === group.userId);
              if (!user) return null;
              return (
                <div
                  key={group.userId}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.specialization ? (
                        <div className="text-xs text-muted-foreground">
                          {user.specialization}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatMoney(Number(group._sum.totalPrice ?? 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group._count._all} броней
                    </div>
                  </div>
                </div>
              );
            })}
            {topGroups.length === 0 && (
              <p className="text-sm text-muted-foreground">Пока нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Последние брони</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((booking) => {
              const dto = toBookingDto(booking);
              return (
                <div
                  key={dto.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{dto.space.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {dto.userName ?? '—'} ·{' '}
                      {formatPeriod(dto.startTime, dto.endTime)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">
                      {BOOKING_STATUS_LABELS[dto.status]}
                    </Badge>
                    <span className="font-semibold">
                      {formatMoney(dto.totalPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">Пока нет броней</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
