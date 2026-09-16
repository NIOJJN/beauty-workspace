import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  answerCallbackQuery,
  parseCallbackData,
  sendTelegramMessage,
} from '@/lib/telegram';
import { cancelBooking, extendBooking } from '@/lib/booking-actions';

/**
 * POST /api/telegram — webhook бота.
 *  /start <код> — привязка Telegram-аккаунта (код из личного кабинета);
 *  callback_query — кнопки Подтвердить / Отменить / Продлить из напоминаний.
 *
 * Проверяется секрет TELEGRAM_WEBHOOK_SECRET (заголовок
 * X-Telegram-Bot-Api-Secret-Token), который задаётся при setWebhook.
 */

interface TelegramUser {
  id: number;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number };
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: { chat: { id: number } };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

const START_TEXT = [
  '👋 Привет! Это бот BeautyWorkspace.',
  '',
  'Здесь вы будете получать коды доступа к рабочим местам,',
  'напоминания о бронях и сможете подтверждать/отменять их.',
  '',
  'Чтобы привязать аккаунт: получите код на странице',
  '«Telegram» в личном кабинете и отправьте мне команду:',
  '<code>/start ВАШ_КОД</code>',
].join('\n');

async function handleMessage(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim() ?? '';
  const fromId = message.from?.id ?? message.chat.id;

  if (!text.startsWith('/start')) {
    await sendTelegramMessage(fromId, START_TEXT);
    return;
  }

  const code = text.split(/\s+/)[1]?.trim();
  if (!code) {
    await sendTelegramMessage(fromId, START_TEXT);
    return;
  }

  // Привязка по одноразовому коду
  const linkCode = await db.linkCode.findUnique({
    where: { code },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!linkCode || linkCode.usedAt || linkCode.expiresAt.getTime() < Date.now()) {
    await sendTelegramMessage(
      fromId,
      '❌ Код недействителен или истёк. Сгенерируйте новый в личном кабинете.',
    );
    return;
  }

  try {
    await db.$transaction([
      db.user.update({
        where: { id: linkCode.user.id },
        data: { telegramId: String(fromId) },
      }),
      db.linkCode.update({
        where: { id: linkCode.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await sendTelegramMessage(
      fromId,
      `✅ Аккаунт привязан: ${linkCode.user.name}. Теперь коды доступа будут приходить сюда.`,
    );
  } catch {
    await sendTelegramMessage(
      fromId,
      '❌ Этот Telegram уже привязан к другому аккаунту.',
    );
  }
}

async function handleCallback(query: TelegramCallbackQuery): Promise<void> {
  const parsed = query.data ? parseCallbackData(query.data) : null;
  if (!parsed) {
    await answerCallbackQuery(query.id, 'Неизвестная команда');
    return;
  }

  const booking = await db.booking.findUnique({
    where: { id: parsed.bookingId },
    include: { user: { select: { id: true, telegramId: true } }, space: { select: { name: true } } },
  });

  // Авторизация: колбэк может нажать только владелец брони
  if (!booking || booking.user.telegramId !== String(query.from.id)) {
    await answerCallbackQuery(query.id, 'Бронь не найдена');
    return;
  }

  if (parsed.action === 'bk_confirm') {
    await answerCallbackQuery(query.id, '✅ Бронь подтверждена. Ждём вас!');
    return;
  }

  if (parsed.action === 'bk_cancel') {
    try {
      const result = await cancelBooking(booking.id, {
        userId: booking.userId,
        isAdmin: false,
      });
      await answerCallbackQuery(query.id, 'Бронь отменена');
      await sendTelegramMessage(
        query.from.id,
        result.refundPercent > 0
          ? `❌ Бронь «${booking.space.name}» отменена. Возврат ${result.refundPercent}% суммы.`
          : `❌ Бронь «${booking.space.name}» отменена.`,
      );
    } catch (error) {
      await answerCallbackQuery(
        query.id,
        error instanceof Error ? error.message : 'Не удалось отменить',
      );
    }
    return;
  }

  if (parsed.action === 'bk_extend') {
    try {
      await extendBooking(booking.id, 'HOUR', 1, booking.userId);
      await answerCallbackQuery(query.id, 'Продление создано');
      await sendTelegramMessage(
        query.from.id,
        `➕ Создана бронь на +1 час после «${booking.space.name}». Завершите оплату в личном кабинете → Мои брони.`,
      );
    } catch (error) {
      await answerCallbackQuery(
        query.id,
        error instanceof Error ? error.message : 'Не удалось продлить',
      );
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    secret &&
    request.headers.get('x-telegram-bot-api-secret-token') !== secret
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
  } catch (error) {
    console.error('[telegram-webhook] Ошибка обработки:', error);
  }

  return NextResponse.json({ ok: true });
}
