import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { getSessionUser } from '@/lib/auth-guard';

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={
          user
            ? { name: user.name, email: user.email, role: user.role }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
