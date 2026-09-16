'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { SPECIALIZATIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [specialization, setSpecialization] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', specialization: '' },
  });

  async function onSubmit(values: RegisterInput): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, specialization }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? 'Не удалось зарегистрироваться');
        return;
      }

      // Автоматический вход после регистрации
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        toast.success('Аккаунт создан — войдите вручную');
        router.push('/login');
        return;
      }
      toast.success('Аккаунт создан. Добро пожаловать!');
      router.push('/account');
      router.refresh();
    } catch {
      toast.error('Что-то пошло не так. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Имя и фамилия</Label>
        <Input id="name" placeholder="Анна Соколова" {...register('name')} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" type="tel" placeholder="+7 900 000-00-00" {...register('phone')} />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Специализация</Label>
        <Select
          value={specialization}
          onValueChange={(value) => {
            setSpecialization(value);
            setValue('specialization', value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите специализацию" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALIZATIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" type="password" placeholder="Минимум 8 символов" {...register('password')} />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Создать аккаунт
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
