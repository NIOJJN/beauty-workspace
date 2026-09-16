import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { isYooKassaConfigured } from '@/lib/yookassa';
import { BOOKING_STATUS_LABELS } from '@/lib/constants';
import { formatDateLabel, formatMoney, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MockConfirmButton } from '@/components/payment/mock-confirm-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Оплата' };

interface PaymentSuccessPageProps {
  searchParams: { bookingId?: string; mock?: string };
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const bookingId = searchParams.bookingId;
  if (!bookingId) {
    return (
      <div className="container max-w-lg py-16">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Бронь не указана. Посмотрите свои брони в кабинете.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/account/bookings">Мои брони</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { space: true, payment: true },
  });

  if (!booking || booking.userId !== user.id) {
    return (
      <div className="container max-w-lg py-16">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Бронь не найдена.
          </CardContent>
        </Card>
      </div>
    );
  }

  const period = `${formatDateLabel(booking.startTime)}, ${formatTime(booking.startTime)}–${formatTime(booking.endTime)}`;

  // Ожидает оплаты в mock-режиме → показываем кнопку тестовой оплаты
  if (
    booking.status === 'PENDING' &&
    searchParams.mock === '1' &&
    !isYooKassaConfigured()
  ) {
    return (
      <div className="container max-w-lg py-16">
        <Card>
          <CardHeader>
            <CardTitle>Тестовая оплата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ЮKassa не настроена (нет ключей в .env). В рабочем режиме здесь
              откроется платёжная страница ЮKassa, а подтверждение придёт
              вебхуком.
            </p>
            <div className="rounded-2xl border border-border/70 bg-primary/[0.04] p-3.5 text-sm">
              <div className="font-semibold">{booking.space.name}</div>
              <div className="text-muted-foreground">{period}</div>
              <div className="mt-1 font-semibold">
                {formatMoney(Number(booking.totalPrice))}
              </div>
            </div>
            <MockConfirmButton bookingId={booking.id} />
            <Button variant="outline" className="w-full" asChild>
              <Link href="/account/bookings">Мои брони</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Успешная оплата: код доступа + QR
  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
    const qrDataUrl = booking.accessCode
      ? await QRCode.toDataURL(
          `BW-ACCESS|${booking.accessCode}|${booking.spaceId}`,
          { width: 220, margin: 1 },
        )
      : null;

    return (
      <div className="container max-w-lg py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="mt-2 text-xl">Бронь подтверждена!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-2xl border border-primary/15 bg-gradient-soft p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Детали брони
              </div>
              <div className="mt-2 font-bold tracking-tight">{booking.space.name}</div>
              {booking.space.address ? (
                <div className="text-sm text-muted-foreground">
                  {booking.space.address}
                </div>
              ) : null}
              <div className="mt-1 text-sm text-muted-foreground">{period}</div>
            </div>

            {booking.accessCode ? (
              <>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Код доступа
                  </div>
                  <div className="mt-1 text-4xl font-extrabold tracking-[0.3em] text-primary">
                    {booking.accessCode}
                  </div>
                </div>
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="QR-код доступа"
                    width={220}
                    height={220}
                    className="mx-auto rounded-2xl border border-border/70 shadow-soft"
                  />
                ) : null}
              </>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/account/bookings">Мои брони</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/spaces">Забронировать ещё</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Прочие состояния: PENDING без mock / PAID / CANCELLED
  const isCancelled = booking.status === 'CANCELLED';
  return (
    <div className="container max-w-lg py-16">
      <Card>
        <CardHeader className="text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              isCancelled ? 'bg-destructive/10' : 'bg-warning/10'
            }`}
          >
            {isCancelled ? (
              <XCircle className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-warning" />
            )}
          </div>
          <CardTitle className="mt-2 text-xl">
            Статус брони: {BOOKING_STATUS_LABELS[booking.status]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="rounded-2xl border border-border/70 bg-primary/[0.04] p-4 text-sm">
            <div className="font-semibold">{booking.space.name}</div>
            <div className="text-muted-foreground">{period}</div>
          </div>
          {!isCancelled && (
            <Badge variant="warning">Ожидаем подтверждение оплаты…</Badge>
          )}
          <Button className="w-full" asChild>
            <Link href="/account/bookings">Мои брони</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
