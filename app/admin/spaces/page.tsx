import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { SPACE_INCLUDE } from '@/lib/space-admin';
import { toSpaceDto } from '@/lib/dto';
import { SPACE_TYPE_LABELS } from '@/lib/constants';
import { formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SpaceActions } from '@/components/admin/space-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Места' };

export default async function AdminSpacesPage() {
  const spaces = await db.space.findMany({
    include: {
      ...SPACE_INCLUDE,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Рабочие места</h1>
          <p className="text-sm text-muted-foreground">
            Всего: {spaces.length}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/spaces/new">Добавить место</Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Цена/час</TableHead>
              <TableHead>Броней</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spaces.map((raw) => {
              const space = toSpaceDto(raw);
              const bookingsCount = '_count' in raw ? raw._count.bookings : 0;
              return (
                <TableRow key={space.id}>
                  <TableCell className="font-medium">{space.name}</TableCell>
                  <TableCell>{SPACE_TYPE_LABELS[space.type]}</TableCell>
                  <TableCell>{formatMoney(space.pricePerHour)}</TableCell>
                  <TableCell>{bookingsCount}</TableCell>
                  <TableCell>
                    {space.isActive ? (
                      <Badge variant="success">Активно</Badge>
                    ) : (
                      <Badge variant="secondary">Скрыто</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SpaceActions
                      spaceId={space.id}
                      isActive={space.isActive}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
