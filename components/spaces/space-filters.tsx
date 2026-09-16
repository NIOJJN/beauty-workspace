'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SPACE_TYPE_LABELS } from '@/lib/constants';
import type { SpaceType } from '@prisma/client';

/** Фильтры каталога: тип места, цена за час, период доступности. */
export function SpaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState<string>(searchParams.get('type') ?? 'ALL');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');

  function apply(): void {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.set('type', type);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    router.push(`/spaces${params.size ? `?${params.toString()}` : ''}`);
  }

  function reset(): void {
    setType('ALL');
    setMinPrice('');
    setMaxPrice('');
    setFrom('');
    setTo('');
    router.push('/spaces');
  }

  return (
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-card backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="filter-type">Тип места</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="filter-type">
            <SelectValue placeholder="Любой тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Любой тип</SelectItem>
            {(
              Object.keys(SPACE_TYPE_LABELS) as SpaceType[]
            ).map((value) => (
              <SelectItem key={value} value={value}>
                {SPACE_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-min">Цена от, ₽/час</Label>
        <Input
          id="filter-min"
          type="number"
          min={0}
          className="no-spinner"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="300"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-max">Цена до, ₽/час</Label>
        <Input
          id="filter-max"
          type="number"
          min={0}
          className="no-spinner"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="800"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-from">Свободно с</Label>
        <Input
          id="filter-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-to">Свободно до</Label>
        <Input
          id="filter-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={apply}>
          <Search className="h-4 w-4" /> Найти
        </Button>
        <Button variant="outline" size="icon" aria-label="Сбросить" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
