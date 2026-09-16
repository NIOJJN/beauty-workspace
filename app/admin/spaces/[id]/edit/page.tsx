import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { SPACE_INCLUDE } from '@/lib/space-admin';
import { toSpaceDto } from '@/lib/dto';
import { SpaceForm } from '@/components/admin/space-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Редактирование места' };

interface EditSpacePageProps {
  params: { id: string };
}

export default async function EditSpacePage({ params }: EditSpacePageProps) {
  const space = await db.space.findUnique({
    where: { id: params.id },
    include: SPACE_INCLUDE,
  });
  if (!space) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/spaces"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> К списку мест
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Редактирование: {space.name}
        </h1>
      </div>
      <SpaceForm space={toSpaceDto(space)} />
    </div>
  );
}
