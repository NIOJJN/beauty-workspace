import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { formatDateFull, formatMoney, formatPeriod } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Документы' };

const PAYMENT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  SUCCEEDED: 'success',
  PENDING: 'warning',
  WAITING_FOR_CAPTURED: 'warning',
  CANCELED: 'destructive',
};

export default async function DocumentsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const payments = await db.payment.findMany({
    where: { booking: { userId: user.id } },
    include: {
      booking: {
        include: { space: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Документы</h1>
        <p className="text-sm text-muted-foreground">
          Чеки и платежи по вашим броням
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Место</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Платёж</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDateFull(payment.createdAt)}</TableCell>
                <TableCell className="font-medium">
                  {payment.booking.space.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatPeriod(payment.booking.startTime, payment.booking.endTime)}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatMoney(Number(payment.amount), true)}
                </TableCell>
                <TableCell>
                  <Badge variant={PAYMENT_STATUS_VARIANT[payment.status] ?? 'secondary'}>
                    {payment.status === 'SUCCEEDED'
                      ? 'Оплачено'
                      : payment.status === 'CANCELED'
                        ? 'Отменён'
                        : payment.status === 'WAITING_FOR_CAPTURED'
                          ? 'Ожидает подтверждения'
                          : 'Ожидает оплаты'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {payment.yookassaId
                    ? payment.yookassaId.startsWith('mock_')
                      ? 'mock'
                      : `ЮKassa · ${payment.yookassaId.slice(0, 12)}…`
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Платежей пока нет. Бронируйте место — чеки появятся здесь.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
