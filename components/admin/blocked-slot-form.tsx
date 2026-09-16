'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { blockedSlotSchema, type BlockedSlotInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BlockedSlotFormProps {
  spaces: Array<{ id: string; name: string }>;
}

/** Форма блокировки слота (техобслуживание и т.п.). */
export function BlockedSlotForm({ spaces }: BlockedSlotFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!spaceId) {
      toast.error('Сначала создайте рабочее место');
      return;
    }

    const payload: BlockedSlotInput = {
      spaceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason,
    };

    const parsed = blockedSlotSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Проверьте поля');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось создать блокировку');
        return;
      }
      toast.success('Слот заблокирован');
      setStartTime('');
      setEndTime('');
      setReason('');
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Новая блокировка</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Место</Label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите место" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-start">Начало</Label>
            <Input
              id="bs-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-end">Конец</Label>
            <Input
              id="bs-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bs-reason">Причина</Label>
            <div className="flex gap-2">
              <Input
                id="bs-reason"
                placeholder="Замена кресла"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
