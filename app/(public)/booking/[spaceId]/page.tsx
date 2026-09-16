import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { toSpaceDto } from '@/lib/dto';
import { SPACE_TYPE_SHORT } from '@/lib/constants';
import { SlotCalendar } from '@/components/calendar/slot-calendar';
import { BookingSummary } from '@/components/booking/booking-summary';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Бронирование' };

interface BookingPageProps {
  params: { spaceId: string };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const [spaceRaw, user] = await Promise.all([
    db.space.findUnique({
      where: { id: params.spaceId, isActive: true },
      include: { schedules: true, tariffs: true },
    }),
    getSessionUser(),
  ]);

  if (!spaceRaw) notFound();

  const space = toSpaceDto(spaceRaw);

  return (
    <div className="container py-10">
      <Link
        href={`/spaces/${space.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Назад к месту
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
        <Badge variant="secondary">{SPACE_TYPE_SHORT[space.type]}</Badge>
        {space.address && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {space.address}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <SlotCalendar space={space} />
        <BookingSummary space={space} isAuthenticated={Boolean(user)} />
      </div>
    </div>
  );
}
