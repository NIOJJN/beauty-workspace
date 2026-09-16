import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { formatPeriod } from '@/lib/utils';
import { BlockedSlotForm } from '@/components/admin/blocked-slot-form';
import { DeleteBlockedSlotButton } from '@/components/admin/delete-blocked-slot-button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Блокировки слотов' };

export default async function AdminBlockedSlotsPage() {
  const [slots, spaces] = await Promise.all([
    db.blockedSlot.findMany({
      include: { space: { select: { name: true } } },
      orderBy: { startTime: 'desc' },
      take: 50,
    }),
    db.space.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Блокировки слотов</h1>
        <p className="text-sm text-muted-foreground">
          Техобслуживание, ремонт, уборка — место недоступно для броней
        </p>
      </div>

      <BlockedSlotForm spaces={spaces} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Активные блокировки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{slot.space.name}</div>
                <div className="text-muted-foreground">
                  {formatPeriod(slot.startTime, slot.endTime)} — {slot.reason}
                </div>
              </div>
              <DeleteBlockedSlotButton slotId={slot.id} />
            </div>
          ))}
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground">Блокировок нет</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
