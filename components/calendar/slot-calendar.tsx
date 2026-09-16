'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarDays, CalendarRange, CalendarX2 } from 'lucide-react';
import type { TariffType } from '@prisma/client';
import { TARIFF_LABELS } from '@/lib/constants';
import type { SpaceDto } from '@/lib/dto';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeekGrid } from '@/components/calendar/week-grid';
import { MonthGrid } from '@/components/calendar/month-grid';
import { useAvailability } from '@/components/calendar/use-availability';
import { useBookingStore } from '@/store/booking-store';

/**
 * Календарь бронирования: табы тарифов, недельная сетка часов (drag)
 * и месячная сетка дней для дневного/месячного тарифов.
 */

interface SlotCalendarProps {
  space: SpaceDto;
}

export function SlotCalendar({ space }: SlotCalendarProps) {
  const tariffMode = useBookingStore((s) => s.tariffMode);
  const setTariffMode = useBookingStore((s) => s.setTariffMode);
  const setHourSelection = useBookingStore((s) => s.setHourSelection);
  const setRange = useBookingStore((s) => s.setRange);

  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const weekRange = useMemo(() => {
    const start = startOfWeek(addWeeks(new Date(), weekOffset), {
      weekStartsOn: 1,
    });
    return { from: start, to: endOfWeek(start, { weekStartsOn: 1 }) };
  }, [weekOffset]);

  const monthRange = useMemo(() => {
    const start = startOfMonth(addMonths(new Date(), monthOffset));
    const end = endOfMonth(addMonths(new Date(), monthOffset));
    return {
      from: startOfWeek(start, { weekStartsOn: 1 }),
      to: endOfWeek(end, { weekStartsOn: 1 }),
    };
  }, [monthOffset]);

  const weekAvailability = useAvailability(space.id, weekRange.from, weekRange.to);
  const monthAvailability = useAvailability(space.id, monthRange.from, monthRange.to);

  function changeMode(mode: string): void {
    const next = mode as TariffType;
    setTariffMode(next);
    setHourSelection(null);
    setRange({ from: null, to: null });
  }

  return (
    <Card className="p-4 sm:p-6">
      <Tabs value={tariffMode} onValueChange={changeMode}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="HOURLY" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{TARIFF_LABELS.HOURLY}</span>
            <span className="sm:hidden">Час</span>
          </TabsTrigger>
          <TabsTrigger value="DAILY" className="gap-1.5">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">{TARIFF_LABELS.DAILY}</span>
            <span className="sm:hidden">День</span>
          </TabsTrigger>
          <TabsTrigger value="MONTHLY" className="gap-1.5">
            <CalendarX2 className="h-4 w-4" />
            <span className="hidden sm:inline">{TARIFF_LABELS.MONTHLY}</span>
            <span className="sm:hidden">Мес</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="HOURLY" className="mt-0">
            <WeekGrid
              space={space}
              availability={weekAvailability.days}
              loading={weekAvailability.loading}
              weekOffset={weekOffset}
              onWeekOffsetChange={setWeekOffset}
            />
          </TabsContent>

          <TabsContent value="DAILY" className="mt-0">
            <MonthGrid
              availability={monthAvailability.days}
              monthOffset={monthOffset}
              onMonthOffsetChange={setMonthOffset}
            />
          </TabsContent>

          <TabsContent value="MONTHLY" className="mt-0">
            <MonthGrid
              availability={monthAvailability.days}
              monthOffset={monthOffset}
              onMonthOffsetChange={setMonthOffset}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Тариф «на месяц» доступен для диапазонов от 30 дней.
            </p>
          </TabsContent>
        </div>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 pt-3.5 text-xs text-muted-foreground">
        <LegendItem className="bg-primary/[0.10] border-primary/20" label="Свободно" />
        <LegendItem className="bg-accent border-accent-foreground/10" label="Занято" />
        <LegendItem className="bg-destructive/15 border-destructive/25" label="Недоступно" />
        <LegendItem className="bg-gradient-primary border-transparent" label="Выбрано" />
      </div>
    </Card>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded-md border ${className}`} />
      {label}
    </span>
  );
}
