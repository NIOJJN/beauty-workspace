'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, Ban, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Верификация/блокировка мастера из таблицы админки. */
export function MasterActions({
  userId,
  isVerified,
  isBlocked,
}: {
  userId: string;
  isVerified: boolean;
  isBlocked: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function update(payload: {
    isVerified?: boolean;
    isBlocked?: boolean;
  }): Promise<void> {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/masters/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось обновить');
        return;
      }
      toast.success('Обновлено');
      startTransition(() => router.refresh());
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => update({ isVerified: !isVerified })}
      >
        {isVerified ? (
          <>
            <RotateCcw className="h-4 w-4" /> Снять верификацию
          </>
        ) : (
          <>
            <BadgeCheck className="h-4 w-4" /> Верифицировать
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={isBlocked ? 'text-success' : 'text-destructive'}
        onClick={() => update({ isBlocked: !isBlocked })}
      >
        {isBlocked ? (
          <>
            <RotateCcw className="h-4 w-4" /> Разблокировать
          </>
        ) : (
          <>
            <Ban className="h-4 w-4" /> Заблокировать
          </>
        )}
      </Button>
    </div>
  );
}
