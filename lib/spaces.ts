import { Prisma, SpaceType } from '@prisma/client';
import { db } from '@/lib/db';
import { SPACE_INCLUDE } from '@/lib/space-admin';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';

/** Общие фильтры каталога мест (используются API и страницей /spaces). */
export interface SpaceFilters {
  type?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  from?: string | null;
  to?: string | null;
}

export async function getFilteredSpaces(filters: SpaceFilters) {
  const where: Prisma.SpaceWhereInput = { isActive: true };

  if (
    filters.type &&
    Object.values(SpaceType).includes(filters.type as SpaceType)
  ) {
    where.type = filters.type as SpaceType;
  }

  const priceCondition: Prisma.IntFilter | undefined =
    filters.minPrice != null || filters.maxPrice != null
      ? {
          gte: filters.minPrice ?? undefined,
          lte: filters.maxPrice ?? undefined,
        }
      : undefined;
  if (priceCondition) where.pricePerHour = priceCondition;

  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;
  const checkAvailability = Boolean(
    fromDate && toDate && !Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()),
  );

  const spaces = await db.space.findMany({
    where,
    include: {
      ...SPACE_INCLUDE,
      bookings: checkAvailability
        ? {
            where: {
              status: { in: ACTIVE_BOOKING_STATUSES },
              startTime: { lt: toDate as Date },
              endTime: { gt: fromDate as Date },
            },
            select: { id: true },
          }
        : false,
    },
    orderBy: { pricePerHour: 'asc' },
  });

  if (!checkAvailability) return spaces;

  // «Свободно на весь период» = нет пересекающихся активных броней
  return spaces
    .filter(
      (space) =>
        !('bookings' in space && Array.isArray(space.bookings) && space.bookings.length > 0),
    )
    .map((space) => {
      const { bookings: _bookings, ...rest } = space;
      return rest;
    });
}

/** Id избранных мест пользователя. */
export async function getFavoriteSpaceIds(userId: string): Promise<string[]> {
  const favorites = await db.favorite.findMany({
    where: { userId },
    select: { spaceId: true },
  });
  return favorites.map((f) => f.spaceId);
}
