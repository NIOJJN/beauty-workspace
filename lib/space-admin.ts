import type { Prisma } from '@prisma/client';
import { TariffType } from '@prisma/client';
import { db } from '@/lib/db';
import type { SpaceInput } from '@/lib/validations';

/**
 * Админские операции над местами: создание/обновление
 * вместе с тарифами и расписанием в одной транзакции.
 */

export const SPACE_INCLUDE = {
  schedules: true,
  tariffs: true,
} satisfies Prisma.SpaceInclude;

function scalarData(data: SpaceInput) {
  return {
    name: data.name,
    type: data.type,
    description: data.description,
    capacity: data.capacity,
    amenities: data.amenities,
    pricePerHour: data.pricePerHour,
    pricePerDay: data.pricePerDay,
    pricePerMonth: data.pricePerMonth,
    bufferMinutes: data.bufferMinutes,
    address: data.address || null,
    rules: data.rules || null,
    isActive: data.isActive,
  };
}

/** Создать место вместе с тарифами и расписанием. */
export async function createSpaceWithRelations(data: SpaceInput) {
  return db.$transaction(async (tx) => {
    const space = await tx.space.create({
      data: { ...scalarData(data), photos: data.photos },
    });
    await syncTariffs(tx, space.id, data);
    await syncSchedules(tx, space.id, data.schedules);
    return tx.space.findUniqueOrThrow({
      where: { id: space.id },
      include: SPACE_INCLUDE,
    });
  });
}

/** Обновить место (photos и scalar-списки через set). */
export async function updateSpaceWithRelations(id: string, data: SpaceInput) {
  const existing = await db.space.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error('Рабочее место не найдено');

  return db.$transaction(async (tx) => {
    await tx.space.update({
      where: { id },
      data: { ...scalarData(data), photos: { set: data.photos } },
    });
    await syncTariffs(tx, id, data);
    await syncSchedules(tx, id, data.schedules);
    return tx.space.findUniqueOrThrow({ where: { id }, include: SPACE_INCLUDE });
  });
}

type Tx = Prisma.TransactionClient;

async function syncTariffs(tx: Tx, spaceId: string, data: SpaceInput): Promise<void> {
  const tariffRows: Array<{
    type: TariffType;
    price: number;
    discount: number;
  }> = [
    { type: TariffType.HOURLY, price: data.pricePerHour, discount: 0 },
    { type: TariffType.DAILY, price: data.pricePerDay, discount: data.dailyDiscount },
    { type: TariffType.MONTHLY, price: data.pricePerMonth, discount: data.monthlyDiscount },
  ];

  for (const row of tariffRows) {
    await tx.tariff.upsert({
      where: { spaceId_type: { spaceId, type: row.type } },
      create: { spaceId, type: row.type, price: row.price, discount: row.discount },
      update: { price: row.price, discount: row.discount },
    });
  }
}

async function syncSchedules(
  tx: Tx,
  spaceId: string,
  schedules: SpaceInput['schedules'],
): Promise<void> {
  for (const entry of schedules) {
    await tx.schedule.upsert({
      where: { spaceId_dayOfWeek: { spaceId, dayOfWeek: entry.dayOfWeek } },
      create: {
        spaceId,
        dayOfWeek: entry.dayOfWeek,
        openTime: entry.openTime,
        closeTime: entry.closeTime,
        isClosed: entry.isClosed,
      },
      update: {
        openTime: entry.openTime,
        closeTime: entry.closeTime,
        isClosed: entry.isClosed,
      },
    });
  }
}
