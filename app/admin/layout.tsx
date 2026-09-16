import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { ShieldCheck } from 'lucide-react';
import { getSessionUser } from '@/lib/auth-guard';
import { getInitials } from '@/lib/utils';
import { AdminNav } from '@/components/admin/admin-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect('/login?callbackUrl=/admin');
  if (user.role !== Role.ADMIN) redirect('/account');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
              <span className="icon-gradient flex h-9 w-9 items-center justify-center rounded-2xl shadow-soft">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">
                Beauty<span className="text-gradient">Workspace</span>
              </span>
            </Link>
            <Badge variant="soft">Админка</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              Кабинет
            </Link>
            <Avatar className="h-9 w-9 shadow-soft">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <ThemeToggle />
          </div>
        </div>
        <div className="lg:hidden">
          <AdminNav variant="mobile" />
        </div>
      </header>

      <div className="container flex gap-8 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <AdminNav variant="sidebar" />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
