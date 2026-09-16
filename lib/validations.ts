import { z } from 'zod';
import { SpaceType, TariffType } from '@prisma/client';

// ============ Базовые схемы ============

/** Время в формате HH:mm («09:00»). */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Время в формате HH:mm');

const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s\-()]{7,18}$/, 'Некорректный номер телефона')
  .optional()
  .or(z.literal(''));

// ============ Auth ============

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(60),
  email: z.string().email('Некорректный email'),
  phone: phoneSchema,
  password: z.string().min(8, 'Минимум 8 символов').max(72),
  specialization: z.string().max(100).optional().or(z.literal('')),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(60),
  phone: phoneSchema,
  specialization: z.string().max(100).optional().or(z.literal('')),
  avatar: z.string().url().optional().or(z.literal('')),
});

// ============ Space (админ) ============

const scheduleEntrySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    openTime: timeString,
    closeTime: timeString,
    isClosed: z.boolean(),
  })
  .refine((s) => s.isClosed || s.openTime < s.closeTime, {
    message: 'Время закрытия должно быть позже открытия',
  });

export const spaceSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100),
  type: z.nativeEnum(SpaceType),
  description: z.string().min(10, 'Минимум 10 символов').max(5000),
  photos: z
    .array(z.string().url('Ссылка на фото должна быть URL'))
    .min(1, 'Добавьте хотя бы одно фото')
    .max(10),
  capacity: z.coerce.number().int().min(1).max(10),
  amenities: z.array(z.string().min(1).max(60)).max(20),
  pricePerHour: z.coerce.number().positive('Цена должна быть больше 0'),
  pricePerDay: z.coerce.number().positive('Цена должна быть больше 0'),
  pricePerMonth: z.coerce.number().positive('Цена должна быть больше 0'),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  address: z.string().max(300).optional().nullable(),
  rules: z.string().max(3000).optional().nullable(),
  isActive: z.boolean().default(true),
  schedules: z
    .array(scheduleEntrySchema)
    .length(7, 'Расписание нужно на все 7 дней'),
  dailyDiscount: z.coerce.number().int().min(0).max(50).default(5),
  monthlyDiscount: z.coerce.number().int().min(0).max(50).default(10),
});

// ============ Booking ============

export const bookingCreateSchema = z
  .object({
    spaceId: z.string().min(1),
    tariffType: z.nativeEnum(TariffType),
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((d) => d.end.getTime() > d.start.getTime(), {
    message: 'Дата окончания должна быть позже начала',
    path: ['end'],
  });

export const extendBookingSchema = z.object({
  bookingId: z.string().min(1),
  unit: z.enum(['HOUR', 'DAY']),
  amount: z.coerce.number().int().min(1).max(30),
});

// ============ Payment ============

export const paymentCreateSchema = z.object({
  bookingId: z.string().min(1),
});

// ============ Blocked slots ============

export const blockedSlotSchema = z
  .object({
    spaceId: z.string().min(1),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    reason: z.string().min(3, 'Укажите причину').max(200),
  })
  .refine((d) => d.endTime.getTime() > d.startTime.getTime(), {
    message: 'Дата окончания должна быть позже начала',
    path: ['endTime'],
  });

// ============ Availability / Reviews / Favorites ============

export const availabilityQuerySchema = z
  .object({
    spaceId: z.string().min(1),
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((d) => d.to.getTime() > d.from.getTime(), {
    message: 'Некорректный диапазон дат',
  })
  .refine((d) => d.to.getTime() - d.from.getTime() <= 92 * 24 * 3600 * 1000, {
    message: 'Максимальный диапазон — 92 дня',
  });

export const reviewSchema = z.object({
  spaceId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal('')),
});

export const favoriteToggleSchema = z.object({
  spaceId: z.string().min(1),
});

// ============ Типы ============

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SpaceInput = z.infer<typeof spaceSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BlockedSlotInput = z.infer<typeof blockedSlotSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
