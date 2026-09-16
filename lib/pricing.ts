import { differenceInMinutes } from 'date-fns';

/**
 * Чистые функции расчёта стоимости брони.
 * Используются и на сервере (создание брони), и на клиенте
 * (калькуляция в реальном времени) — поэтому без серверных зависимостей.
 */

export type TariffMode = 'HOURLY' | 'DAILY' | 'MONTHLY';

export interface TariffInfo {
  type: TariffMode;
  price: number;
  minHours: number;
  discount: number;
}

export interface PriceInput {
  start: Date | string;
  end: Date | string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerMonth: number;
  tariffs?: TariffInfo[];
  mode: TariffMode;
}

export interface PriceResult {
  mode: TariffMode;
  /** Фактические часы/дни/месяцы длительности */
  hours: number;
  days: number;
  months: number;
  /** Оплачиваемых единиц (с учётом minHours тарифа) */
  billableUnits: number;
  /** Цена за единицу */
  unitPrice: number;
  /** Стоимость без скидки */
  base: number;
  discountPercent: number;
  discountAmount: number;
  /** Итого к оплате */
  total: number;
  minHours: number;
}

/** Округление до копеек, чтобы избежать 0.1 + 0.2 артефактов. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computePrice(input: PriceInput): PriceResult {
  const start = new Date(input.start);
  const end = new Date(input.end);
  const minutes = Math.max(0, differenceInMinutes(end, start));
  const hours = Math.max(1, Math.ceil(minutes / 60));
  const days = Math.max(1, Math.ceil(minutes / (60 * 24)));
  const months = Math.max(1, Math.ceil(days / 30));

  const tariff = input.tariffs?.find((t) => t.type === input.mode);
  let billableUnits: number;
  let unitPrice: number;
  let minHours = 1;

  switch (input.mode) {
    case 'HOURLY':
      minHours = tariff?.minHours ?? 1;
      billableUnits = Math.max(hours, minHours);
      unitPrice = tariff?.price ?? input.pricePerHour;
      break;
    case 'DAILY':
      billableUnits = days;
      unitPrice = input.pricePerDay;
      break;
    case 'MONTHLY':
      billableUnits = months;
      unitPrice = input.pricePerMonth;
      break;
  }

  const base = roundMoney(billableUnits * unitPrice);
  const discountPercent = tariff?.discount ?? 0;
  const discountAmount = roundMoney((base * discountPercent) / 100);
  const total = roundMoney(base - discountAmount);

  return {
    mode: input.mode,
    hours,
    days,
    months,
    billableUnits,
    unitPrice,
    base,
    discountPercent,
    discountAmount,
    total,
    minHours,
  };
}

/**
 * Проверка длительности под выбранный тариф.
 * Возвращает текст ошибки или null, если всё ок.
 */
export function validateModeDuration(
  mode: TariffMode,
  start: Date | string,
  end: Date | string,
  minHours = 1,
): string | null {
  const minutes = differenceInMinutes(new Date(end), new Date(start));
  if (minutes <= 0) return 'Интервал должен быть положительным';
  if (mode === 'HOURLY' && minutes < minHours * 60) {
    return `Минимальное бронирование — ${minHours} ч`;
  }
  if (mode === 'MONTHLY') {
    const days = minutes / (60 * 24);
    if (days < 30) {
      return 'Тариф «на месяц» доступен для броней от 30 дней';
    }
  }
  return null;
}

/** «3 ч» / «2 дня» / «1 мес» */
export function durationLabel(mode: TariffMode, billableUnits: number): string {
  switch (mode) {
    case 'HOURLY':
      return `${billableUnits} ч`;
    case 'DAILY': {
      const mod10 = billableUnits % 10;
      const mod100 = billableUnits % 100;
      const word =
        mod10 === 1 && mod100 !== 11
          ? 'день'
          : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? 'дня'
            : 'дней';
      return `${billableUnits} ${word}`;
    }
    case 'MONTHLY': {
      const word = billableUnits === 1 ? 'мес' : 'мес';
      return `${billableUnits} ${word}`;
    }
  }
}
