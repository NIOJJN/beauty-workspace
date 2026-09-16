import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-guard';
import { isTelegramConfigured } from '@/lib/telegram';
import { TelegramLinkPanel } from '@/components/account/telegram-link-panel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Telegram' };

export default async function TelegramPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { telegramId: true },
  });

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Telegram</h1>
        <p className="text-sm text-muted-foreground">
          Напоминания, коды доступа и управление бронями через бота
        </p>
      </div>

      <TelegramLinkPanel
        linked={Boolean(user?.telegramId)}
        botConfigured={isTelegramConfigured()}
        botUsername={botUsername}
      />
    </div>
  );
}
