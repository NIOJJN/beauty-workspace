import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SpaceForm } from '@/components/admin/space-form';

export const metadata: Metadata = { title: 'Новое место' };

export default function NewSpacePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/spaces"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> К списку мест
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Новое рабочее место</h1>
      </div>
      <SpaceForm />
    </div>
  );
}
