'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Copy, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TelegramLinkPanelProps {
  linked: boolean;
  botConfigured: boolean;
  botUsername: string | null;
}

/** Привязка Telegram: одноразовый код → команда /start <код> боту. */
export function TelegramLinkPanel({
  linked,
  botConfigured,
  botUsername,
}: TelegramLinkPanelProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (linked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-success" /> Telegram привязан
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Коды доступа и напоминания о бронях будут приходить в бот. Там же
            можно подтверждать, отменять и продлевать брони.
          </p>
          <p>
            Чтобы отвязать аккаунт — напишите администратору или удалите
            переписку с ботом.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function generateCode(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram/link', { method: 'POST' });
      const data = (await response.json()) as { code?: string; error?: string };
      if (!response.ok || !data.code) {
        toast.error(data.error ?? 'Не удалось создать код');
        return;
      }
      setCode(data.code);
    } catch {
      toast.error('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  }

  function copyCode(): void {
    if (!code) return;
    void navigator.clipboard.writeText(code);
    toast.success('Код скопирован');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Привязка Telegram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!botConfigured && (
          <div className="rounded-lg bg-warning/10 p-3 text-sm">
            Бот пока не настроен администратором (TELEGRAM_BOT_TOKEN не задан).
            Код можно получить позже.
          </div>
        )}

        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Откройте бота{' '}
            {botUsername ? (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @{botUsername}
              </a>
            ) : (
              '(ссылку спросите у администратора)'
            )}
          </li>
          <li>Получите одноразовый код кнопкой ниже</li>
          <li>
            Отправьте боту команду{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">/start КОД</code>
          </li>
        </ol>

        {code ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Ваш код (15 минут)</div>
              <div className="text-2xl font-bold tracking-[0.3em] text-primary">
                {code}
              </div>
            </div>
            <Button variant="outline" size="icon" aria-label="Скопировать" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={generateCode} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Получить код привязки
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
