import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';

/**
 * Конфигурация NextAuth.js: JWT-сессии, вход по email + пароль.
 * Роль пользователя хранится в JWT и пробрасывается в сессию.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Email и пароль',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const user = await db.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          });
          if (!user || user.isBlocked) return null;

          const isValid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash,
          );
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error('[auth] Ошибка авторизации:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? Role.MASTER;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? '';
        session.user.role = token.role ?? Role.MASTER;
      }
      return session;
    },
  },
};
