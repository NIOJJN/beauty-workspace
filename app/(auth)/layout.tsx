import Link from 'next/link';
import { Scissors, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-[24rem] w-[24rem] rounded-full bg-primary/20 blur-3xl animate-float" />
        <div
          className="absolute -right-20 bottom-4 h-[22rem] w-[22rem] rounded-full bg-accent blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <Link href="/" className="mb-7 flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
        <span className="icon-gradient flex h-10 w-10 items-center justify-center rounded-2xl shadow-soft">
          <Scissors className="h-4 w-4" />
        </span>
        <span>
          Beauty<span className="text-gradient">Workspace</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-4xl border border-white/60 bg-card/85 p-8 shadow-float backdrop-blur-xl dark:border-white/10">
        {children}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Бронируйте место за пару минут и платите только за нужное время
      </p>
    </div>
  );
}
