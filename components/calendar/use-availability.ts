'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { DayAvailability } from '@/lib/availability';

interface AvailabilityState {
  /** Ключ «yyyy-MM-dd» → данные дня */
  days: Map<string, DayAvailability>;
  loading: boolean;
  error: boolean;
}

/** Загрузка доступности слотов места с интервала дат. */
export function useAvailability(
  spaceId: string,
  from: Date,
  to: Date,
): AvailabilityState {
  const fromKey = format(from, 'yyyy-MM-dd');
  const toKey = format(to, 'yyyy-MM-dd');
  const [state, setState] = useState<AvailabilityState>({
    days: new Map(),
    loading: true,
    error: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: false }));

    fetch(
      `/api/availability?spaceId=${spaceId}&from=${fromKey}&to=${toKey}`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error('availability request failed');
        return response.json() as Promise<{ days: DayAvailability[] }>;
      })
      .then((data) => {
        const map = new Map(data.days.map((day) => [day.date, day]));
        setState({ days: map, loading: false, error: false });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ days: new Map(), loading: false, error: true });
      });

    return () => controller.abort();
  }, [spaceId, fromKey, toKey]);

  return state;
}
