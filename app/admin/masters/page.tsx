import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { formatDateFull } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MasterActions } from '@/components/admin/master-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Мастера' };

export default async function AdminMastersPage() {
  const admin = await getSessionUser();
  const users = await db.user.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мастера</h1>
        <p className="text-sm text-muted-foreground">
          Верификация и блокировка аккаунтов
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Мастер</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead>Броней</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  {user.specialization ? (
                    <div className="text-xs text-muted-foreground">
                      {user.specialization}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{user.email}</div>
                  {user.phone ? <div>{user.phone}</div> : null}
                  {user.telegramId ? (
                    <div className="text-xs">TG: {user.telegramId}</div>
                  ) : null}
                </TableCell>
                <TableCell>{user._count.bookings}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateFull(user.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">
                      {user.role === 'ADMIN' ? 'Админ' : 'Мастер'}
                    </Badge>
                    {user.isVerified && <Badge variant="success">Верифицирован</Badge>}
                    {user.isBlocked && <Badge variant="destructive">Заблокирован</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {admin?.id !== user.id && (
                    <MasterActions
                      userId={user.id}
                      isVerified={user.isVerified}
                      isBlocked={user.isBlocked}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
