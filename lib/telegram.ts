/**
 * Telegram Bot API через fetch (без тяжёлых зависимостей).
 * Все методы безопасны: при отсутствии конфигурации или сетевой ошибке
 * они логируют проблему, но не бросают исключений.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const isTelegramConfigured = (): boolean => Boolean(BOT_TOKEN);

export const CALLBACK_ACTIONS = {
  CONFIRM: 'bk_confirm',
  CANCEL: 'bk_cancel',
  EXTEND: 'bk_extend',
} as const;

export function buildCallbackData(
  action: keyof typeof CALLBACK_ACTIONS,
  bookingId: string,
): string {
  return `${CALLBACK_ACTIONS[action]}:${bookingId}`;
}

export function parseCallbackData(
  data: string,
): { action: string; bookingId: string } | null {
  const [action, bookingId] = data.split(':');
  if (!action || !bookingId) return null;
  return { action, bookingId };
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

async function callMethod<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T | null> {
  if (!BOT_TOKEN) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено');
    return null;
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    );
    const data = (await response.json()) as {
      ok: boolean;
      result?: T;
      description?: string;
    };
    if (!data.ok) {
      console.error(`[telegram] ${method} завершился ошибкой:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (error) {
    console.error('[telegram] Сетевая ошибка:', error);
    return null;
  }
}

/** Отправить сообщение с HTML-разметкой и опциональной inline-клавиатурой. */
export async function sendTelegramMessage(
  chatId: string | number,
  html: string,
  buttons?: InlineButton[][],
): Promise<boolean> {
  const result = await callMethod<{ message_id: number }>('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
  return result !== null;
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await callMethod('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

/** Установить webhook (запускается вручную при деплое). */
export async function setTelegramWebhook(
  url: string,
  secretToken?: string,
): Promise<boolean> {
  const result = await callMethod<boolean>('setWebhook', {
    url,
    ...(secretToken ? { secret_token: secretToken } : {}),
    allowed_updates: ['message', 'callback_query'],
  });
  return result === true;
}
