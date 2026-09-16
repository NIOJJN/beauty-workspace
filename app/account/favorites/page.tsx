import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { toSpaceDto } from '@/lib/dto';
import { getFavoriteSpaceIds } from '@/lib/spaces';
import { SPACE_INCLUDE } from '@/lib/space-admin';
import { SpaceCard } from '@/components/spaces/space-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Избранное' };

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    include: { space: { include: SPACE_INCLUDE } },
    orderBy: { createdAt: 'desc' },
  });

  const spaces = favorites
    .map((favorite) => (favorite.space.isActive ? toSpaceDto(favorite.space) : null))
    .filter((space): space is NonNullable<typeof space> => space !== null);

  const favoriteIds = await getFavoriteSpaceIds(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Избранное</h1>
        <p className="text-sm text-muted-foreground">
          Места, которые вы отметили сердечком
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} favorited={favoriteIds.includes(space.id)} isAuthenticated />
        ))}
      </div>

      {spaces.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Пока пусто. Добавляйте места в избранное сердечком на карточке.
        </div>
      )}
    </div>
  );
}
