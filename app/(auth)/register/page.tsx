import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Регистрация' };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Регистрация мастера</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Бронируйте рабочие места за пару кликов
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
