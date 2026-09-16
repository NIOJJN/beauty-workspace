'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import type { SpaceType } from '@prisma/client';
import { spaceSchema, type SpaceInput } from '@/lib/validations';
import {
  AMENITY_SUGGESTIONS,
  DAY_OF_WEEK_LABELS,
  SPACE_TYPE_LABELS,
} from '@/lib/constants';
import type { SpaceDto } from '@/lib/dto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SpaceFormProps {
  space?: SpaceDto;
}

/** Форма создания/редактирования места (админка). */
export function SpaceForm({ space }: SpaceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<SpaceType>(space?.type ?? 'CHAIR');
  const [photos, setPhotos] = useState<string>(
    space?.photos.join('\n') ?? '',
  );
  const [amenities, setAmenities] = useState<string[]>(
    space?.amenities ?? [],
  );
  const [amenityDraft, setAmenityDraft] = useState('');

  const [schedules, setSchedules] = useState(() => {
    const base = space?.schedules ?? [];
    return Array.from({ length: 7 }, (_, day) => {
      const found = base.find((s) => s.dayOfWeek === day);
      return {
        dayOfWeek: day,
        openTime: found?.openTime ?? '09:00',
        closeTime: found?.closeTime ?? '21:00',
        isClosed: found?.isClosed ?? false,
      };
    });
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpaceInput>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: space?.name ?? '',
      type: space?.type ?? 'CHAIR',
      description: space?.description ?? '',
      photos: space?.photos ?? [],
      capacity: space?.capacity ?? 1,
      amenities: space?.amenities ?? [],
      pricePerHour: space?.pricePerHour ?? 300,
      pricePerDay: space?.pricePerDay ?? 2000,
      pricePerMonth: space?.pricePerMonth ?? 40000,
      bufferMinutes: space?.bufferMinutes ?? 15,
      address: space?.address ?? '',
      rules: space?.rules ?? '',
      isActive: space?.isActive ?? true,
      dailyDiscount: space?.tariffs.find((t) => t.type === 'DAILY')?.discount ?? 5,
      monthlyDiscount: space?.tariffs.find((t) => t.type === 'MONTHLY')?.discount ?? 10,
      schedules: Array.from({ length: 7 }, (_, day) => {
        const found = space?.schedules.find((s) => s.dayOfWeek === day);
        return {
          dayOfWeek: day,
          openTime: found?.openTime ?? '09:00',
          closeTime: found?.closeTime ?? '21:00',
          isClosed: found?.isClosed ?? false,
        };
      }),
    },
  });

  async function onSubmit(values: SpaceInput): Promise<void> {
    setSaving(true);
    try {
      const payload: SpaceInput = {
        ...values,
        type,
        photos: photos.split('\n').map((line) => line.trim()).filter(Boolean),
        amenities,
        schedules,
      };

      const response = await fetch(
        space ? `/api/spaces/${space.id}` : '/api/spaces',
        {
          method: space ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось сохранить место');
        return;
      }
      toast.success(space ? 'Место обновлено' : 'Место создано');
      router.push('/admin/spaces');
      router.refresh();
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setSaving(false);
    }
  }

  function addAmenity(value: string): void {
    const trimmed = value.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setAmenityDraft('');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Основное */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sf-name">Название</Label>
          <Input id="sf-name" placeholder="Кресло у окна" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Тип места</Label>
          <Select value={type} onValueChange={(v) => setType(v as SpaceType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {SPACE_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sf-description">Описание</Label>
          <Textarea
            id="sf-description"
            rows={4}
            placeholder="Уютное кресло у окна с естественным светом…"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sf-photos">
            Фотографии (по одной ссылке в строке)
          </Label>
          <Textarea
            id="sf-photos"
            rows={4}
            value={photos}
            onChange={(e) => setPhotos(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sf-address">Адрес</Label>
          <Input
            id="sf-address"
            placeholder="ул. Пушкина, 10, 2 этаж"
            {...register('address')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sf-capacity">Вместимость (человек)</Label>
          <Input
            id="sf-capacity"
            type="number"
            min={1}
            className="no-spinner"
            {...register('capacity')}
          />
          {errors.capacity && (
            <p className="text-xs text-destructive">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      {/* Удобства */}
      <div className="space-y-2">
        <Label>Удобства</Label>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
            >
              {amenity}
              <button
                type="button"
                aria-label={`Убрать ${amenity}`}
                onClick={() =>
                  setAmenities((prev) => prev.filter((a) => a !== amenity))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Добавить удобство…"
            value={amenityDraft}
            onChange={(e) => setAmenityDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAmenity(amenityDraft);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addAmenity(amenityDraft)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {AMENITY_SUGGESTIONS.filter((s) => !amenities.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addAmenity(s)}
              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Цены */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sf-hour">Цена за час, ₽</Label>
          <Input
            id="sf-hour"
            type="number"
            min={1}
            className="no-spinner"
            {...register('pricePerHour')}
          />
          {errors.pricePerHour && (
            <p className="text-xs text-destructive">{errors.pricePerHour.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-day">Цена за день, ₽</Label>
          <Input
            id="sf-day"
            type="number"
            min={1}
            className="no-spinner"
            {...register('pricePerDay')}
          />
          {errors.pricePerDay && (
            <p className="text-xs text-destructive">{errors.pricePerDay.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-month">Цена за месяц, ₽</Label>
          <Input
            id="sf-month"
            type="number"
            min={1}
            className="no-spinner"
            {...register('pricePerMonth')}
          />
          {errors.pricePerMonth && (
            <p className="text-xs text-destructive">{errors.pricePerMonth.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-buffer">Буфер между бронями, мин</Label>
          <Input
            id="sf-buffer"
            type="number"
            min={0}
            max={120}
            className="no-spinner"
            {...register('bufferMinutes')}
          />
          {errors.bufferMinutes && (
            <p className="text-xs text-destructive">{errors.bufferMinutes.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-daily-disc">Скидка дневного тарифа, %</Label>
          <Input
            id="sf-daily-disc"
            type="number"
            min={0}
            max={50}
            className="no-spinner"
            {...register('dailyDiscount')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-monthly-disc">Скидка месячного тарифа, %</Label>
          <Input
            id="sf-monthly-disc"
            type="number"
            min={0}
            max={50}
            className="no-spinner"
            {...register('monthlyDiscount')}
          />
        </div>
      </div>

      {/* Правила */}
      <div className="space-y-1.5">
        <Label htmlFor="sf-rules">Правила (придут мастеру в Telegram)</Label>
        <Textarea
          id="sf-rules"
          rows={3}
          placeholder="Код действует только на время брони. Уберите за собой рабочее место."
          {...register('rules')}
        />
      </div>

      {/* Расписание */}
      <div className="space-y-2">
        <Label>Расписание работы</Label>
        <div className="space-y-2">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.dayOfWeek}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <span className="w-28 text-sm font-medium">
                {DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}
              </span>
              <Input
                type="time"
                className="w-28"
                value={schedule.openTime}
                disabled={schedule.isClosed}
                onChange={(e) =>
                  setSchedules((prev) =>
                    prev.map((s, i) =>
                      i === index ? { ...s, openTime: e.target.value } : s,
                    ),
                  )
                }
              />
              <span className="text-sm text-muted-foreground">—</span>
              <Input
                type="time"
                className="w-28"
                value={schedule.closeTime}
                disabled={schedule.isClosed}
                onChange={(e) =>
                  setSchedules((prev) =>
                    prev.map((s, i) =>
                      i === index ? { ...s, closeTime: e.target.value } : s,
                    ),
                  )
                }
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={schedule.isClosed}
                  onCheckedChange={(checked) =>
                    setSchedules((prev) =>
                      prev.map((s, i) =>
                        i === index ? { ...s, isClosed: checked } : s,
                      ),
                    )
                  }
                />
                Выходной
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {space ? 'Сохранить изменения' : 'Создать место'}
        </Button>
      </div>
    </form>
  );
}

