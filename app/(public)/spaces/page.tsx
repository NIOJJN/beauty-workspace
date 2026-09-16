import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth-guard';
import { getFavoriteSpaceIds, getFilteredSpaces } from '@/lib/spaces';
import { toSpaceDto } from '@/lib/dto';
import { SpaceCard } from '@/components/spaces/space-card';
import { SpaceFilters } from '@/components/spaces/space-filters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Рабочие места',
};

interface SpacesPageProps {
  searchParams: {
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    from?: string;
    to?: string;
  };
}

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
  const user = await getSessionUser();

  const [spaces, favoriteIds] = await Promise.all([
    getFilteredSpaces({
      type: searchParams.type ?? null,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : null,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : null,
      from: searchParams.from ?? null,
      to: searchParams.to ?? null,
    }),
    user ? getFavoriteSpaceIds(user.id) : Promise.resolve([]),
  ]);

  const dto = spaces.map(toSpaceDto);

  return (
    <div className="container py-12 md:py-16">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-10 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-6 -top-10 h-56 w-56 rounded-full bg-accent blur-3xl" />
        </div>
        <p className="eyebrow">Каталог</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
          Рабочие места
        </h1>
        <p className="mt-2 text-muted-foreground">
          Найдено мест: <span className="font-semibold text-foreground">{dto.length}</span>
        </p>
      </div>

      <div className="mt-7">
        <SpaceFilters />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dto.map((space) => (
          <SpaceCard
            key={space.id}
            space={space}
            favorited={favoriteIds.includes(space.id)}
            isAuthenticated={Boolean(user)}
          />
        ))}
      </div>

      {dto.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-14 text-center">
          <p className="font-semibold">Ничего не нашлось</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте изменить фильтры или расширить диапазон цены.
          </p>
        </div>
      )}
    </div>
  );
}
