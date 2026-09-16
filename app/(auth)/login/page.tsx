import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Вход' };

interface LoginPageProps {
  searchParams: { callbackUrl?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl =
    searchParams.callbackUrl?.startsWith('/') ? searchParams.callbackUrl : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold">Вход для мастеров</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Войдите, чтобы бронировать рабочие места
      </p>

      <div className="mt-6">
        <LoginForm callbackUrl={callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Зарегистрируйтесь
        </Link>
      </p>
    </div>
  );
}
