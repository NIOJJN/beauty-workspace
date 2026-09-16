'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatMoney } from '@/lib/utils';
import { SPACE_TYPE_SHORT } from '@/lib/constants';
import type { SpaceDto } from '@/lib/dto';

interface SpaceCardProps {
  space: SpaceDto;
  favorited?: boolean;
  isAuthenticated?: boolean;
}

export function SpaceCard({
  space,
  favorited = false,
  isAuthenticated = false,
}: SpaceCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(favorited);
  const [pending, startTransition] = useTransition();

  function toggleFavorite(event: React.MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/spaces');
      return;
    }

    const next = !isFav;
    setIsFav(next);
    startTransition(async () => {
      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId: space.id }),
        });
        if (!response.ok) throw new Error('failed');
        const data = (await response.json()) as { favorited: boolean };
        setIsFav(data.favorited);
      } catch {
        setIsFav(!next); // откат оптимистичного обновления
      }
    });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Link
        href={`/spaces/${space.id}`}
        className="group block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 ease-soft hover:border-primary/25 hover:shadow-float"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {space.photos[0] ? (
            <Image
              src={space.photos[0]}
              alt={space.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 ease-soft group-hover:scale-105"
            />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[hsl(258_26%_16%/_0.35)] to-transparent"
          />
          <Badge variant="outline" className="absolute left-3 top-3 shadow-soft">
            {SPACE_TYPE_SHORT[space.type]}
          </Badge>
          <button
            type="button"
            aria-label="В избранное"
            onClick={toggleFavorite}
            disabled={pending}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/85 shadow-soft backdrop-blur transition-all duration-300 hover:scale-105',
              isFav ? 'text-primary' : 'text-muted-foreground hover:text-primary',
            )}
          >
            <Heart className={cn('h-4 w-4', isFav && 'fill-current')} />
          </button>
        </div>

        <div className="p-5">
          <div className="font-bold leading-tight tracking-tight transition-colors duration-200 group-hover:text-primary">
            {space.name}
          </div>
          {space.address ? (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {space.address}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <Badge variant="soft" className="gap-1">
              <Users className="h-3 w-3" /> до {space.capacity}
            </Badge>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-border/60 pt-4">
            <div>
              <div className="text-lg font-extrabold tracking-tight">
                {formatMoney(space.pricePerHour)}
              </div>
              <div className="text-xs text-muted-foreground">за час</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{formatMoney(space.pricePerDay)}</div>
              <div className="text-xs text-muted-foreground">за день</div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
