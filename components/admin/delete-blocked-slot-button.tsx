'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Кнопка удаления блокировки слота. */
export function DeleteBlockedSlotButton({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove(): Promise<void> {
    setBusy(true);
    try {
      const response = await fetch(`/api/blocked-slots?id=${slotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? 'Не удалось удалить');
        return;
      }
      toast.success('Блокировка снята');
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Удалить блокировку"
      onClick={remove}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-destructive" />}
    </Button>
  );
}
