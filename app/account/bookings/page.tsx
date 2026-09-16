import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';
import { toBookingDto } from '@/lib/dto';
import { BookingList } from '@/components/account/booking-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Мои брони' };

export default async function AccountBookingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    include: {
      payment: { select: { status: true } },
      space: { select: { id: true, name: true, type: true, photos: true, address: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  const now = Date.now();
  const dtos = bookings.map(toBookingDto);
  const active = dtos.filter(
    (b) =>
      ACTIVE_BOOKING_STATUSES.includes(b.status) &&
      new Date(b.endTime).getTime() >= now,
  );
  const history = dtos.filter((b) => !active.includes(b));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мои брони</h1>
        <p className="text-sm text-muted-foreground">
          Оплата, продление и отмена в один клик
        </p>
      </div>

      <BookingList
        active={active}
        history={history}
        mockMode={!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY}
      />
    </div>
  );
}
