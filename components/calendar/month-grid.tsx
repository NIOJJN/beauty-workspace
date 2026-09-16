'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, toDateKey } from '@/lib/utils';
import { useBookingStore } from '@/store/booking-store';
import type { SlotInfoMap } from '@/components/calendar/week-grid';

/**
 * Месячная сетка для тарифов «На день» и «На месяц».
 * Первый клик — начало диапазона, второй — конец.
 */

interface MonthGridProps {
  availability: Map<string, SlotInfoMap>;
  /** Управляемая навигация по месяцам (владелец состояния — SlotCalendar) */
  monthOffset: number;
  onMonthOffsetChange: (offset: number) => void;
}

type DayStatus = 'PAST' | 'CLOSED' | 'BUSY' | 'PARTIAL' | 'FREE';

export function MonthGrid({
  availability,
  monthOffset,
  onMonthOffsetChange,
}: MonthGridProps) {
  const range = useBookingStore((s) => s.range);
  const setRange = useBookingStore((s) => s.setRange);

  const monthStart = startOfMonth(addMonths(new Date(), monthOffset));
  const cells = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
      }),
    [monthStart],
  );

  function statusOf(date: Date): DayStatus {
    const dateKey = toDateKey(date);
    if (dateKey < toDateKey(new Date())) return 'PAST';
    const day = availability.get(dateKey);
    if (!day || day.isClosed) return 'CLOSED';
    const free = day.slots.filter((slot) => slot.status === 'FREE').length;
    if (day.slots.length === 0) return 'CLOSED';
    if (free === 0) return 'BUSY';
    if (free / day.slots.length < 0.6) return 'PARTIAL';
    return 'FREE';
  }

  function inRange(dateKey: string): boolean {
    if (!range.from) return false;
    if (range.from && range.to) return dateKey >= range.from && dateKey <= range.to;
    return dateKey === range.from;
  }

  function handleDayClick(dateKey: string): void {
    const status = statusOf(new Date(`${dateKey}T12:00:00`));
    if (status === 'PAST' || status === 'CLOSED') return;

    if (!range.from || (range.from && range.to)) {
      setRange({ from: dateKey, to: null });
      return;
    }
    if (dateKey < range.from) {
      setRange({ from: dateKey, to: range.from });
      return;
    }
    setRange({ from: range.from, to: dateKey });
  }

  const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold tracking-tight">
          {format(monthStart, 'LLLL yyyy', { locale: ru })}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => onMonthOffsetChange(monthOffset - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground shadow-soft transition-all duration-300 ease-soft hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => onMonthOffsetChange(monthOffset + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground shadow-soft transition-all duration-300 ease-soft hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80"
          >
            {label}
          </div>
        ))}

        {cells.map((day) => {
          const dateKey = toDateKey(day);
          const status = statusOf(day);
          const selected = inRange(dateKey);
          const isEndpoint = range.from === dateKey || range.to === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(dateKey)}
              disabled={status === 'PAST' || status === 'CLOSED'}
              className={cn(
                'relative aspect-square rounded-xl border border-border/70 text-sm font-medium transition-all duration-200 ease-soft disabled:cursor-not-allowed',
                !isSameMonth(day, monthStart) && 'opacity-40',
                status === 'FREE' && 'hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
                status === 'PARTIAL' && 'bg-warning/10 hover:bg-warning/20',
                status === 'BUSY' && 'bg-muted/60 text-muted-foreground line-through',
                status === 'CLOSED' && 'bg-muted/30 text-muted-foreground',
                status === 'PAST' && 'opacity-30',
                selected && 'border-primary/40 bg-primary/15 text-primary',
                isEndpoint &&
                  'border-transparent bg-primary text-primary-foreground shadow-glow hover:bg-primary',
              )}
            >
              {format(day, 'd')}
              {status === 'PARTIAL' && !isEndpoint && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-warning" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Лавандовым — свободный день, жёлтой точкой — частичная занятость.
        Выберите первый и последний день диапазона.
      </p>
    </div>
  );
}
