import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden p-4 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[18rem] w-[18rem] rounded-full bg-accent blur-3xl" />
      </div>

      <span className="icon-gradient flex h-16 w-16 items-center justify-center rounded-3xl shadow-glow">
        <Compass className="h-7 w-7" />
      </span>

      <div className="text-6xl font-extrabold tracking-tight text-gradient sm:text-7xl">404</div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Страница не найдена</h1>
      <p className="max-w-md text-muted-foreground">
        Возможно, место сняли с публикации или ссылка устарела.
      </p>
      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <Button size="lg" className="shadow-glow" asChild>
          <Link href="/spaces">
            <Compass className="h-4 w-4" /> Смотреть рабочие места
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> На главную
          </Link>
        </Button>
      </div>
    </div>
  );
}
