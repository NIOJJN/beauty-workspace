import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
} from 'lucide-react';
import { db } from '@/lib/db';
import { toReviewDto, toSpaceDto } from '@/lib/dto';
import {
  DAY_OF_WEEK_LABELS,
  SPACE_TYPE_LABELS,
  TARIFF_LABELS,
} from '@/lib/constants';
import { formatMoney, formatDateFull } from '@/lib/utils';
import { SpaceGallery } from '@/components/spaces/space-gallery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const space = await db.space.findUnique({
    where: { id: params.id },
    select: { name: true, description: true },
  });
  return {
    title: space?.name ?? 'Рабочее место',
    description: space?.description.slice(0, 150),
  };
}

export default async function SpaceDetailPage({ params }: Props) {
  const space = await db.space.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      schedules: true,
      tariffs: true,
      reviews: {
        include: { user: { select: { name: true, specialization: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!space) notFound();

  const dto = toSpaceDto(space);
  const reviews = space.reviews.map(toReviewDto);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const schedules = [...dto.schedules].sort(
    (a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7),
  );

  return (
    <div className="container py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <SpaceGallery photos={dto.photos} name={dto.name} />

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{dto.name}</h1>
              <Badge variant="secondary">{SPACE_TYPE_LABELS[dto.type]}</Badge>
              {avgRating !== null && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {avgRating.toFixed(1)} · {reviews.length} отз.
                </span>
              )}
            </div>

            {dto.address && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {dto.address}
              </div>
            )}

            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {dto.description}
            </p>
          </div>

          {dto.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Удобства</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dto.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {amenity}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Тарифы</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {dto.tariffs.map((tariff) => (
                <div key={tariff.type} className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    {TARIFF_LABELS[tariff.type]}
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {formatMoney(tariff.price)}
                  </div>
                  {tariff.discount > 0 && (
                    <Badge variant="success" className="mt-2">
                      −{tariff.discount}%
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" /> Режим работы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {schedules.map((schedule) => (
                <div
                  key={schedule.dayOfWeek}
                  className="flex items-center justify-between"
                >
                  <span>{DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}</span>
                  <span
                    className={
                      schedule.isClosed
                        ? 'text-muted-foreground'
                        : 'font-medium'
                    }
                  >
                    {schedule.isClosed
                      ? 'Закрыто'
                      : `${schedule.openTime}–${schedule.closeTime}`}
                  </span>
                </div>
              ))}
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Буфер между бронями: {dto.bufferMinutes} мин — время на уборку
                и проветривание.
              </p>
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Отзывы мастеров</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {review.userName}
                        {review.userSpecialization ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {review.userSpecialization}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-warning text-warning"
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatDateFull(review.createdAt)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Липкая карточка бронирования */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="text-3xl font-bold">
                  {formatMoney(dto.pricePerHour)}
                  <span className="text-base font-normal text-muted-foreground">
                    {' '}
                    / час
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  день — {formatMoney(dto.pricePerDay)}, месяц —{' '}
                  {formatMoney(dto.pricePerMonth)}
                </div>
              </div>

              <Button size="lg" className="w-full" asChild>
                <Link href={`/booking/${dto.id}`}>
                  <Calendar className="h-4 w-4" /> Забронировать
                </Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Выберите часы в календаре, оплатите — код доступа придёт в
                Telegram
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
