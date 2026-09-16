'use client';

import { useMemo, useRef, useState } from 'react';
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { SlotInfo } from '@/lib/availability';
import type { SpaceDto } from '@/lib/dto';
import { cn, toDateKey } from '@/lib/utils';
import { useBookingStore } from '@/store/booking-store';

/**
 * Недельная сетка часов в стиле Calendly: 7 дней × часы.
 * Drag-to-select мышью и пальцем (Pointer Events + pointer capture).
 */

export interface SlotInfoMap {
  slots: Array<{ hour: number; status: SlotInfo['status'] }>;
  isClosed: boolean;
}

interface WeekGridProps {
  space: SpaceDto;
  availability: Map<string, SlotInfoMap>;
  loading: boolean;
  /** Управляемая навигация по неделям (владелец состояния — SlotCalendar) */
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
}

export function WeekGrid({
  space,
  availability,
  loading,
  weekOffset,
  onWeekOffsetChange,
}: WeekGridProps) {
  const setHourSelection = useBookingStore((s) => s.setHourSelection);
  const selection = useBookingStore((s) => s.hourSelection);
  const gridRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{
    date: string;
    anchor: number;
    end: number;
  } | null>(null);

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1,
  });
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      }),
    [weekStart],
  );

  const { minHour, maxHour } = useMemo(() => {
    let min = 23;
    let max = 8;
    for (const schedule of space.schedules) {
      if (schedule.isClosed) continue;
      const open = Number(schedule.openTime.split(':')[0]);
      const close = Number(schedule.closeTime.split(':')[0]);
      if (!Number.isNaN(open)) min = Math.min(min, open);
      if (!Number.isNaN(close)) max = Math.max(max, close);
    }
    return {
      minHour: Math.max(6, min),
      maxHour: Math.min(24, max),
    };
  }, [space.schedules]);

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = minHour; h < maxHour; h++) result.push(h);
    return result;
  }, [minHour, maxHour]);

  function statusOf(
    dateKey: string,
    hour: number,
  ): SlotInfo['status'] | 'CLOSED' {
    const day = availability.get(dateKey);
    if (!day) return 'CLOSED';
    return day.slots.find((slot) => slot.hour === hour)?.status ?? 'PAST';
  }

  function cellFromPoint(
    x: number,
    y: number,
  ): { date: string; hour: number } | null {
    const element = document
      .elementFromPoint(x, y)
      ?.closest('[data-cell]') as HTMLElement | null;
    if (!element?.dataset.date) return null;
    const hour = Number(element.dataset.hour);
    if (Number.isNaN(hour)) return null;
    return { date: element.dataset.date, hour };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    if (statusOf(cell.date, cell.hour) !== 'FREE') return;
    setDraft({ date: cell.date, anchor: cell.hour, end: cell.hour });
    try {
      gridRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* pointer capture может не поддерживаться — не критично */
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!draft) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell || cell.date !== draft.date || cell.hour === draft.end) return;
    setDraft((prev) => (prev ? { ...prev, end: cell.hour } : prev));
  }

  function handlePointerUp(): void {
    if (!draft) return;
    const from = Math.min(draft.anchor, draft.end);
    const to = Math.max(draft.anchor, draft.end);
    const hoursToBook: number[] = [];
    for (let h = from; h <= to; h++) {
      if (statusOf(draft.date, h) === 'FREE') hoursToBook.push(h);
    }
    setHourSelection(
      hoursToBook.length > 0 ? { date: draft.date, hours: hoursToBook } : null,
    );
    setDraft(null);
  }

  const draftRange = draft
    ? ([
        Math.min(draft.anchor, draft.end),
        Math.max(draft.anchor, draft.end),
      ] as const)
    : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">
          {format(weekStart, 'LLLL yyyy', { locale: ru })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Предыдущая неделя"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground shadow-soft transition-all duration-300 ease-soft hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onWeekOffsetChange(0)}
            className="rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-xs font-semibold shadow-soft transition-all duration-300 ease-soft hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
          >
            Сегодня
          </button>
          <button
            type="button"
            aria-label="Следующая неделя"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground shadow-soft transition-all duration-300 ease-soft hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div
          ref={gridRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="grid touch-none select-none overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-soft"
          style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))' }}
        >
          {/* Шапка с днями */}
          <div className="border-b border-border/70 bg-primary/[0.04]" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'border-b border-l border-border/70 bg-primary/[0.04] py-2 text-center',
                isSameDay(day, new Date()) && 'bg-primary/12',
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEEEEE', { locale: ru })}
              </div>
              <div className="text-sm font-semibold">{format(day, 'd')}</div>
            </div>
          ))}

          {/* Строки часов */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="flex items-start justify-end border-b pr-2 pt-1 text-xs text-muted-foreground">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((day) => {
                const dateKey = toDateKey(day);
                const status = statusOf(dateKey, hour);
                const inDraft =
                  draftRange !== null &&
                  draft?.date === dateKey &&
                  hour >= draftRange[0] &&
                  hour <= draftRange[1];
                const inSelection =
                  selection?.date === dateKey &&
                  selection.hours.includes(hour);

                return (
                  <div
                    key={`${dateKey}-${hour}`}
                    data-cell
                    data-date={dateKey}
                    data-hour={hour}
                    className={cn(
                      'h-9 border-b border-l border-border/70 transition-colors',
                      status === 'FREE' &&
                        'cursor-pointer bg-primary/[0.10] hover:bg-primary/30',
                      status === 'BOOKED' && 'bg-accent',
                      status === 'BLOCKED' && 'bg-destructive/15',
                      status === 'PAST' && 'bg-muted/25 opacity-60',
                      status === 'CLOSED' && 'bg-muted/15',
                      inDraft && 'bg-primary/35 hover:bg-primary/35',
                      inSelection &&
                        'bg-gradient-primary text-primary-foreground hover:bg-gradient-primary',
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Зажмите мышь (или проведите пальцем) и выделите нужные часы в пределах
        одного дня.
      </p>
    </div>
  );
}
