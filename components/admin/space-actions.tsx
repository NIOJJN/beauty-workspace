'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Действия над местом в таблице админки: вкл/выкл, редактировать, удалить. */
export function SpaceActions({
  spaceId,
  isActive,
}: {
  spaceId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function toggleActive(): Promise<void> {
    setBusy(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось изменить статус');
        return;
      }
      toast.success(!isActive ? 'Место включено' : 'Место скрыто из каталога');
      startTransition(() => router.refresh());
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    setBusy(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось удалить');
        return;
      }
      toast.success('Место скрыто (мягкое удаление — история броней сохранена)');
      setConfirmOpen(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || pending;

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" asChild aria-label="Редактировать">
          <Link href={`/admin/spaces/${spaceId}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isActive ? 'Скрыть' : 'Включить'}
          disabled={disabled}
          onClick={toggleActive}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className={`h-4 w-4 ${isActive ? '' : 'text-muted-foreground'}`} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Удалить"
          disabled={disabled}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить место?</DialogTitle>
            <DialogDescription>
              Место исчезнет из каталога, но история броней сохранится
              (мягкое удаление).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={remove} disabled={disabled}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
