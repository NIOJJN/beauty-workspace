'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarClock,
  Copy,
  CreditCard,
  Loader2,
  Plus,
  Undo2,
} from 'lucide-react';
import { BOOKING_STATUS_LABELS, REFUND_THRESHOLD_HOURS } from '@/lib/constants';
import type { BookingDto } from '@/lib/dto';
import { cn, formatMoney, formatPeriod } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BookingListProps {
  active: BookingDto[];
  history: BookingDto[];
  mockMode: boolean;
}

const STATUS_VARIANT: Record<
  BookingDto['status'],
  'success' | 'warning' | 'destructive' | 'secondary'
> = {
  CONFIRMED: 'success',
  PAID: 'success',
  PENDING: 'warning',
  CANCELLED: 'destructive',
  COMPLETED: 'secondary',
};

export function BookingList({ active, history, mockMode }: BookingListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingDto | null>(null);
  const router = useRouter();

  async function pay(booking: BookingDto): Promise<void> {
    setBusyId(booking.id);
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = (await response.json()) as {
        confirmationUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.confirmationUrl) {
        toast.error(data.error ?? 'Не удалось создать платёж');
        return;
      }
      window.location.href = data.confirmationUrl;
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(): Promise<void> {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });
      const data = (await response.json()) as {
        refundPercent?: number;
        error?: string;
      };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось отменить бронь');
        return;
      }
      toast.success(
        data.refundPercent && data.refundPercent > 0
          ? `Бронь отменена. Возврат ${data.refundPercent}% суммы в течение 3–10 дней`
          : 'Бронь отменена',
      );
      setCancelTarget(null);
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusyId(null);
    }
  }

  async function extend(
    booking: BookingDto,
    unit: 'HOUR' | 'DAY',
  ): Promise<void> {
    setBusyId(booking.id);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXTEND', unit, amount: 1 }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось продлить');
        return;
      }
      toast.success(
        'Создана бронь на продление — завершите оплату в списке активных',
      );
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusyId(null);
    }
  }

  function copyAccessCode(code: string): void {
    void navigator.clipboard.writeText(code);
    toast.success('Код доступа скопирован');
  }

  /** Процент возврата при отмене прямо сейчас */
  function refundPercent(booking: BookingDto): number {
    const hours =
      (new Date(booking.startTime).getTime() - Date.now()) / 3_600_000;
    return hours >= REFUND_THRESHOLD_HOURS ? 100 : 50;
  }

  function renderCard(booking: BookingDto, isActive: boolean) {
    const busy = busyId === booking.id;
    const canExtend =
      isActive && (booking.status === 'PAID' || booking.status === 'CONFIRMED');

    return (
      <Card key={booking.id}>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-28">
            {booking.space.photos[0] ? (
              <Image
                src={booking.space.photos[0]}
                alt={booking.space.name}
                fill
                sizes="120px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/spaces/${booking.space.id}`}
                className="font-semibold hover:underline"
              >
                {booking.space.name}
              </Link>
              <Badge variant={STATUS_VARIANT[booking.status]}>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
              {mockMode && booking.status === 'PENDING' && (
                <Badge variant="outline" className="text-xs">
                  dev: mock-оплата
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {formatPeriod(booking.startTime, booking.endTime)}
            </div>
            {booking.accessCode && booking.status !== 'PENDING' && (
              <button
                type="button"
                onClick={() => copyAccessCode(booking.accessCode as string)}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Код:{' '}
                <span className="font-bold tracking-widest">
                  {booking.accessCode}
                </span>
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-lg font-bold">
              {formatMoney(booking.totalPrice)}
            </div>
            <div className="flex flex-wrap gap-2">
              {booking.status === 'PENDING' && (
                <Button size="sm" disabled={busy} onClick={() => pay(booking)}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Оплатить
                </Button>
              )}
              {canExtend && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => extend(booking, 'HOUR')}
                  >
                    <Plus className="h-4 w-4" /> 1 час
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => extend(booking, 'DAY')}
                  >
                    <Plus className="h-4 w-4" /> 1 день
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => setCancelTarget(booking)}
                  >
                    <Undo2 className="h-4 w-4" /> Отменить
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Активные{active.length > 0 ? ` (${active.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="history">
            История{history.length > 0 ? ` (${history.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {active.length > 0 ? active.map((b) => renderCard(b, true)) : <EmptyHint />}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length > 0 ? (
            history.map((b) => renderCard(b, false))
          ) : (
            <EmptyHint />
          )}
        </TabsContent>
      </Tabs>

      {/* Диалог отмены с политикой возврата */}
      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Отменить бронь?</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  «{cancelTarget.space.name}» ·{' '}
                  {formatPeriod(cancelTarget.startTime, cancelTarget.endTime)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              'rounded-lg p-3 text-sm',
              cancelTarget && refundPercent(cancelTarget) === 100
                ? 'bg-success/10'
                : 'bg-warning/10',
            )}
          >
            {cancelTarget && refundPercent(cancelTarget) === 100 ? (
              <>
                До начала больше {REFUND_THRESHOLD_HOURS} ч — возврат 100%
                суммы.
              </>
            ) : (
              <>До начала меньше {REFUND_THRESHOLD_HOURS} ч — возврат 50% суммы.</>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Оставить
            </Button>
            <Button
              variant="destructive"
              onClick={cancel}
              disabled={busyId === cancelTarget?.id}
            >
              {busyId === cancelTarget?.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Отменить бронь
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="text-muted-foreground">Здесь пока пусто</p>
      <Button className="mt-4" asChild>
        <Link href="/spaces">Выбрать рабочее место</Link>
      </Button>
    </div>
  );
}
