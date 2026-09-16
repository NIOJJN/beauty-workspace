import { create } from 'zustand';
import type { TariffMode } from '@/lib/pricing';

/**
 * Состояние выбора в календаре бронирования.
 * HOURLY — contiguous часы одного дня; DAILY/MONTHLY — диапазон дат.
 */

export interface HourSelection {
  /** «2025-05-12» */
  date: string;
  /** Часы начала слотов, отсортированы по возрастанию (10 → 10:00–11:00) */
  hours: number[];
}

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface BookingState {
  tariffMode: TariffMode;
  hourSelection: HourSelection | null;
  range: DateRange;
  setTariffMode: (mode: TariffMode) => void;
  setHourSelection: (selection: HourSelection | null) => void;
  setRange: (range: DateRange) => void;
  reset: () => void;
}

const initialRange: DateRange = { from: null, to: null };

export const useBookingStore = create<BookingState>((set) => ({
  tariffMode: 'HOURLY',
  hourSelection: null,
  range: initialRange,
  setTariffMode: (tariffMode) => set({ tariffMode }),
  setHourSelection: (hourSelection) => set({ hourSelection }),
  setRange: (range) => set({ range }),
  reset: () => set({ tariffMode: 'HOURLY', hourSelection: null, range: initialRange }),
}));
