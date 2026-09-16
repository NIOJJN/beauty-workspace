import type {
  Booking,
  BookingStatus,
  Payment,
  PaymentStatus,
  Review,
  Schedule,
  Space,
  SpaceType,
  Tariff,
  TariffType,
} from '@prisma/client';

/**
 * DTO для передачи данных из Server Components в Client Components.
 * Prisma Decimal не сериализуется через RSC-границу — все деньги конвертируем в number.
 */

export interface ScheduleDto {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface TariffDto {
  type: TariffType;
  price: number;
  minHours: number;
  discount: number;
}

export interface SpaceDto {
  id: string;
  name: string;
  type: SpaceType;
  description: string;
  photos: string[];
  capacity: number;
  amenities: string[];
  pricePerHour: number;
  pricePerDay: number;
  pricePerMonth: number;
  bufferMinutes: number;
  address: string | null;
  rules: string | null;
  isActive: boolean;
  schedules: ScheduleDto[];
  tariffs: TariffDto[];
}

export type SpaceWithRelations = Space & {
  schedules: Schedule[];
  tariffs: Tariff[];
};

export function toSpaceDto(space: SpaceWithRelations): SpaceDto {
  return {
    id: space.id,
    name: space.name,
    type: space.type,
    description: space.description,
    photos: space.photos,
    capacity: space.capacity,
    amenities: space.amenities,
    pricePerHour: Number(space.pricePerHour),
    pricePerDay: Number(space.pricePerDay),
    pricePerMonth: Number(space.pricePerMonth),
    bufferMinutes: space.bufferMinutes,
    address: space.address,
    rules: space.rules,
    isActive: space.isActive,
    schedules: space.schedules
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
        isClosed: s.isClosed,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    tariffs: space.tariffs.map((t) => ({
      type: t.type,
      price: Number(t.price),
      minHours: t.minHours,
      discount: t.discount,
    })),
  };
}

export interface SpaceSummaryDto {
  id: string;
  name: string;
  type: SpaceType;
  photos: string[];
  address: string | null;
}

export interface BookingDto {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  tariffType: TariffType;
  accessCode: string | null;
  createdAt: string;
  paymentStatus: PaymentStatus | null;
  userName?: string | null;
  space: SpaceSummaryDto;
}

type BookingWithRelations = Booking & {
  payment?: Pick<Payment, 'status'> | null;
  space?: Pick<Space, 'id' | 'name' | 'type' | 'photos' | 'address'>;
  user?: Pick<import('@prisma/client').User, 'name'>;
};

export function toBookingDto(booking: BookingWithRelations): BookingDto {
  return {
    id: booking.id,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    tariffType: booking.tariffType,
    accessCode: booking.accessCode,
    createdAt: booking.createdAt.toISOString(),
    paymentStatus: booking.payment?.status ?? null,
    userName: booking.user?.name ?? null,
    space: {
      id: booking.space?.id ?? '',
      name: booking.space?.name ?? '',
      type: booking.space?.type ?? 'CHAIR',
      photos: booking.space?.photos ?? [],
      address: booking.space?.address ?? null,
    },
  };
}


export interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
  userSpecialization: string | null;
}

type ReviewWithUser = Review & {
  user: Pick<import('@prisma/client').User, 'name' | 'specialization'>;
};

export function toReviewDto(review: ReviewWithUser): ReviewDto {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    userName: review.user.name,
    userSpecialization: review.user.specialization,
  };
}

export interface PaymentListItemDto {
  id: string;
  amount: number;
  status: PaymentStatus;
  yookassaId: string | null;
  createdAt: string;
  bookingId: string;
  spaceName: string;
  period: string;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'MASTER' | 'ADMIN';
  specialization: string | null;
  isVerified: boolean;
  isBlocked: boolean;
  bookingsCount: number;
  createdAt: string;
}
