'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Кнопка подтверждения mock-платежа.
 * Появляется только в dev-режиме (ключи ЮKassa не заданы).
 */
export function MockConfirmButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось подтвердить оплату');
        return;
      }
      toast.success('Тестовая оплата подтверждена');
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={confirm} disabled={loading}>
      {loading ? 'Подтверждаем…' : (
        <>
          <CreditCard className="h-4 w-4" /> Подтвердить тестовую оплату
        </>
      )}
    </Button>
  );
}
