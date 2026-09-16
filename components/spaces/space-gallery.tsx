'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Галерея места: большое фото + миниатюры. */
export function SpaceGallery({ photos, name }: { photos: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex] ?? photos[0];

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border/70 bg-primary/[0.06] shadow-card">
        {active ? (
          <Image
            src={active}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.02]"
          />
        ) : null}
      </div>

      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-primary/[0.06] transition-all duration-300 ease-soft',
                index === activeIndex
                  ? 'border-primary shadow-soft'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
              aria-label={`Фото ${index + 1}`}
            >
              <Image
                src={photo}
                alt={`${name} — фото ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
