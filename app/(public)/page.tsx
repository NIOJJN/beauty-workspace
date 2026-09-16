import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { SPACE_INCLUDE } from '@/lib/space-admin';
import { toSpaceDto } from '@/lib/dto';
import { getSessionUser } from '@/lib/auth-guard';
import { getFavoriteSpaceIds } from '@/lib/spaces';
import { Hero } from '@/components/home/hero';
import { SpaceCard } from '@/components/spaces/space-card';
import { Button } from '@/components/ui/button';

// Данные зависят от сессии и времени — рендерим на каждый запрос
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();

  const [rawSpaces, favoriteIds] = await Promise.all([
    db.space.findMany({
      where: { isActive: true },
      include: SPACE_INCLUDE,
      orderBy: { pricePerHour: 'asc' },
      take: 3,
    }),
    user ? getFavoriteSpaceIds(user.id) : Promise.resolve([]),
  ]);

  const spaces = rawSpaces.map(toSpaceDto);

  return (
    <>
      <Hero />

      <section className="container py-16 md:py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Каталог</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
              Рабочие места
            </h2>
            <p className="mt-2 text-muted-foreground">
              Кресла, кабинеты, станции и залы — готовы к работе
            </p>
          </div>
          <Button variant="soft" asChild className="hidden sm:inline-flex">
            <Link href="/spaces">
              Все места <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              favorited={favoriteIds.includes(space.id)}
              isAuthenticated={Boolean(user)}
            />
          ))}
        </div>

        {spaces.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-14 text-center">
            <p className="font-semibold">Места скоро появятся</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Загляните позже — мы уже готовим новые пространства.
            </p>
          </div>
        )}
      </section>

      <section className="container pb-8 md:pb-16">
        <div className="relative overflow-hidden rounded-4xl border border-border/70 bg-gradient-soft px-6 py-16 text-center shadow-card md:px-16 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-accent blur-3xl"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
            <p className="eyebrow">Экосистема для мастеров</p>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Выходи за рамки привычного
            </h2>
            <p className="text-muted-foreground md:text-lg">
              Без аренды и коммуналки. Бронируйте кресло на утро, станцию на вечер или
              кабинет на весь месяц — скидка за месяц до 10%.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="shadow-glow" asChild>
                <Link href="/spaces">
                  Посмотреть места <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">Смотреть тарифы</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
