'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { computePrice, validateModeDuration } from '@/lib/pricing';
import { REFUND_THRESHOLD_HOURS, TARIFF_LABELS } from '@/lib/constants';
import type { SpaceDto } from '@/lib/dto';
import { cn, formatDateLabel, formatMoney, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBookingStore } from '@/store/booking-store';

interface BookingSummaryProps {
  space: SpaceDto;
  isAuthenticated: boolean;
}

/** Панель: тариф, выбранный интервал, расчёт стоимости и оплата. */
export function BookingSummary({
  space,
  isAuthenticated,
}: BookingSummaryProps) {
  const tariffMode = useBookingStore((s) => s.tariffMode);
  const hourSelection = useBookingStore((s) => s.hourSelection);
  const range = useBookingStore((s) => s.range);
  const [submitting, setSubmitting] = useState(false);

  const hourlyTariff = space.tariffs.find((t) => t.type === 'HOURLY');
  const minHours = hourlyTariff?.minHours ?? 1;

  const interval = useMemo(() => {
    function scheduleFor(dateKey: string) {
      const day = new Date(`${dateKey}T12:00:00`).getDay();
      return space.schedules.find((s) => s.dayOfWeek === day) ?? null;
    }

    if (tariffMode === 'HOURLY') {
      if (!hourSelection || hourSelection.hours.length === 0) return null;
      const first = hourSelection.hours[0];
      const last = hourSelection.hours[hourSelection.hours.length - 1];
      if (first === undefined || last === undefined) return null;
      // Диапазон должен быть непрерывным
      if (last - first + 1 !== hourSelection.hours.length) return null;
      const midnight = new Date(`${hourSelection.date}T00:00:00`);
      return {
        start: new Date(midnight.getTime() + first * 3_600_000),
        end: new Date(midnight.getTime() + (last + 1) * 3_600_000),
      };
    }

    if (!range.from || !range.to) return null;
    const fromSchedule = scheduleFor(range.from);
    const toSchedule = scheduleFor(range.to);
    if (!fromSchedule || !toSchedule || fromSchedule.isClosed || toSchedule.isClosed) {
      return null;
    }
    return {
      start: new Date(`${range.from}T${fromSchedule.openTime}:00`),
      end: new Date(`${range.to}T${toSchedule.closeTime}:00`),
    };
  }, [tariffMode, hourSelection, range, space.schedules]);

  const gapWarning =
    tariffMode === 'HOURLY' &&
    hourSelection !== null &&
    hourSelection.hours.length > 0 &&
    (() => {
      const first = hourSelection.hours[0] ?? 0;
      const last = hourSelection.hours[hourSelection.hours.length - 1] ?? 0;
      return last - first + 1 !== hourSelection.hours.length;
    })();

  const pricing = useMemo(() => {
    if (!interval) return null;
    return computePrice({
      start: interval.start,
      end: interval.end,
      pricePerHour: space.pricePerHour,
      pricePerDay: space.pricePerDay,
      pricePerMonth: space.pricePerMonth,
      tariffs: space.tariffs,
      mode: tariffMode,
    });
  }, [interval, space, tariffMode]);

  async function submit(): Promise<void> {
    if (!interval) {
      toast.error('Сначала выберите время в календаре');
      return;
    }
    const durationError = validateModeDuration(
      tariffMode,
      interval.start,
      interval.end,
      minHours,
    );
    if (durationError) {
      toast.error(durationError);
      return;
    }

    setSubmitting(true);
    try {
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: space.id,
          tariffType: tariffMode,
          start: interval.start.toISOString(),
          end: interval.end.toISOString(),
        }),
      });
      const bookingData = (await bookingResponse.json()) as {
        booking?: { id: string };
        error?: string;
      };
      if (!bookingResponse.ok || !bookingData.booking) {
        toast.error(bookingData.error ?? 'Не удалось создать бронь');
        return;
      }

      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingData.booking.id }),
      });
      const paymentData = (await paymentResponse.json()) as {
        confirmationUrl?: string;
        error?: string;
      };
      if (!paymentResponse.ok || !paymentData.confirmationUrl) {
        toast.error(paymentData.error ?? 'Не удалось создать платёж');
        return;
      }

      toast.success('Бронь создана — переходим к оплате');
      window.location.href = paymentData.confirmationUrl;
    } catch {
      toast.error('Сетевая ошибка. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle>Ваша бронь</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Тариф */}
        <div className="grid grid-cols-3 gap-2">
          {space.tariffs.map((tariff) => (
            <button
              key={tariff.type}
              type="button"
              onClick={() => useBookingStore.getState().setTariffMode(tariff.type)}
              className={cn(
                'rounded-2xl border p-2.5 text-center text-xs transition-all duration-300 ease-soft',
                tariffMode === tariff.type
                  ? 'border-primary/40 bg-primary/10 font-bold text-primary shadow-soft'
                  : 'border-border/70 hover:border-primary/30 hover:bg-primary/[0.05]',
              )}
            >
              {TARIFF_LABELS[tariff.type]}
              <div className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                {formatMoney(tariff.price)}
              </div>
            </button>
          ))}
        </div>

        {/* Интервал */}
        {interval ? (
          <div className="rounded-2xl bg-primary/[0.05] p-3.5 text-sm ring-1 ring-inset ring-primary/10">
            <div className="font-semibold">{formatDateLabel(interval.start)}</div>
            <div className="text-muted-foreground">
              {formatTime(interval.start)} – {formatTime(interval.end)}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.02] p-3.5 text-sm text-muted-foreground">
            {tariffMode === 'HOURLY'
              ? 'Выделите часы в календаре слева'
              : 'Выберите первый и последний день в календаре'}
          </div>
        )}

        {gapWarning && (
          <div className="flex items-start gap-2 rounded-2xl bg-warning/12 p-3.5 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            В выделенном диапазоне есть занятые часы. Выберите непрерывный
            отрезок.
          </div>
        )}

        {/* Расчёт */}
        {pricing && (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {formatMoney(pricing.unitPrice)} × {pricing.billableUnits}
              </span>
              <span>{formatMoney(pricing.base, true)}</span>
            </div>
            {pricing.discountPercent > 0 && (
              <div className="flex justify-between text-success">
                <span>Скидка тарифа {pricing.discountPercent}%</span>
                <span>−{formatMoney(pricing.discountAmount, true)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Итого</span>
              <span>{formatMoney(pricing.total, true)}</span>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <Button
            className="w-full"
            size="lg"
            disabled={!interval || submitting || gapWarning}
            onClick={submit}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Создаём бронь…' : 'Забронировать и оплатить'}
          </Button>
        ) : (
          <Button className="w-full" size="lg" asChild>
            <Link href={`/login?callbackUrl=/booking/${space.id}`}>
              Войти и забронировать
            </Link>
          </Button>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Отмена раньше, чем за {REFUND_THRESHOLD_HOURS} ч до начала — возврат
          100%, позже — 50%. Код доступа придёт в Telegram после оплаты.
        </div>
      </CardContent>
    </Card>
  );
}

