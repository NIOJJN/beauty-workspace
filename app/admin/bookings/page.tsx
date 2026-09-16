import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { toBookingDto } from '@/lib/dto';
import { BOOKING_STATUS_LABELS } from '@/lib/constants';
import { formatMoney, formatPeriod } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Брони' };

const STATUSES = Object.values(BookingStatus);

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = STATUSES.includes(
    searchParams.status as BookingStatus,
  )
    ? (searchParams.status as BookingStatus)
    : null;

  const bookings = await db.booking.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      user: { select: { name: true } },
      space: { select: { id: true, name: true, type: true, photos: true, address: true } },
      payment: { select: { status: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Все брони</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip label="Все" href="/admin/bookings" active={!statusFilter} />
          {STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={BOOKING_STATUS_LABELS[status]}
              href={`/admin/bookings?status=${status}`}
              active={statusFilter === status}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Место</TableHead>
              <TableHead>Мастер</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const dto = toBookingDto(booking);
              return (
                <TableRow key={dto.id}>
                  <TableCell className="font-medium">{dto.space.name}</TableCell>
                  <TableCell>{dto.userName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPeriod(dto.startTime, dto.endTime)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatMoney(dto.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {BOOKING_STATUS_LABELS[dto.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Броней нет
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  );
}
