import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/** Объединение Tailwind-классов (шадcn-утилита). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Формат денег: 1200 → «1 200 ₽». */
export function formatMoney(value: number, precise = false): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: precise ? 2 : 0,
    maximumFractionDigits: precise ? 2 : 0,
  }).format(value);
}

/** «12 мая, пн» */
export function formatDateLabel(value: string | Date): string {
  return format(new Date(value), 'd MMMM, EEEEEE', { locale: ru });
}

/** «12 мая 2025» */
export function formatDateFull(value: string | Date): string {
  return format(new Date(value), 'd MMMM yyyy', { locale: ru });
}

/** «12 мая, 14:00 – 18:00» */
export function formatPeriod(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = format(s, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd');
  if (sameDay) {
    return `${format(s, 'd MMMM', { locale: ru })}, ${format(s, 'HH:mm')}–${format(e, 'HH:mm')}`;
  }
  return `${format(s, 'd MMM', { locale: ru })} – ${format(e, 'd MMM, HH:mm', { locale: ru })}`;
}

/** «14:00» */
export function formatTime(value: string | Date): string {
  return format(new Date(value), 'HH:mm');
}

/** Инициалы для аватара: «Анна Соколова» → «АС». */
export function getInitials(name?: string | null): string {
  if (!name) return '??';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Абсолютный URL приложения (для писем, Telegram, return_url). */
export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Ключ даты вида «2025-05-12». */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
