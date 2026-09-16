import type { BookingStatus, SpaceType, TariffType } from '@prisma/client';

/** Статусы брони, которые занимают слот в календаре. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING',
  'PAID',
  'CONFIRMED',
];

/** Отменяемые статусы (мастер может отменить). */
export const CANCELLABLE_STATUSES: BookingStatus[] = [
  'PENDING',
  'PAID',
  'CONFIRMED',
];

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  CHAIR: 'Парикмахерское кресло',
  CABINET: 'Кабинет',
  STATION: 'Маникюрная станция',
  ROOM: 'Зал',
};

export const SPACE_TYPE_SHORT: Record<SpaceType, string> = {
  CHAIR: 'Кресло',
  CABINET: 'Кабинет',
  STATION: 'Станция',
  ROOM: 'Зал',
};

export const TARIFF_LABELS: Record<TariffType, string> = {
  HOURLY: 'Почасово',
  DAILY: 'На день',
  MONTHLY: 'На месяц',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачена',
  CONFIRMED: 'Подтверждена',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
};

/** Варианты специализаций для регистрации. */
export const SPECIALIZATIONS = [
  'Парикмахер',
  'Барбер',
  'Бровист',
  'Лешмейкер',
  'Мастер маникюра',
  'Визажист',
  'Косметолог',
  'Другое',
] as const;

/** Подсказки удобств для формы админа. */
export const AMENITY_SUGGESTIONS = [
  'Зеркало',
  'Мойка',
  'Розетки у кресла',
  'Wi-Fi',
  'Кондиционер',
  'Стерилизатор',
  'Кушетка',
  'Кольцевая лампа',
  'Парковка',
  'Кофе-зона',
  'Хранение инструментов',
  'Кушетка для процедур',
] as const;

/** Правила отмены: > 24ч — возврат 100%, < 24ч — 50%. */
export const REFUND_FULL_PERCENT = 100;
export const REFUND_PARTIAL_PERCENT = 50;
export const REFUND_THRESHOLD_HOURS = 24;

/** Названия дней недели (0 = воскресенье — как в Date.getDay). */
export const DAY_OF_WEEK_LABELS = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export const DAY_OF_WEEK_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
