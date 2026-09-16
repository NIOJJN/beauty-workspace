import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  buildCallbackData,
  sendTelegramMessage,
  type InlineButton,
} from '@/lib/telegram';

/**
 * Шаблоны Telegram-сообщений: код доступа, напоминания с кнопками,
 * отмены и уведомления админу.
 */

function periodLabel(start: Date, end: Date): string {
  const sameDay =
    format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
  if (sameDay) {
    return `${format(start, 'd MMMM yyyy', { locale: ru })}, ${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`;
  }
  return `${format(start, 'd MMM yyyy, HH:mm', { locale: ru })} — ${format(end, 'd MMM yyyy, HH:mm', { locale: ru })}`;
}

export interface BookingMessageData {
  spaceName: string;
  spaceAddress: string | null;
  start: Date;
  end: Date;
  accessCode?: string | null;
  totalPrice?: number;
}

function bookingBody(data: BookingMessageData): string {
  return [
    `📍 <b>${data.spaceName}</b>`,
    data.spaceAddress ? `Адрес: ${data.spaceAddress}` : null,
    `🕐 ${periodLabel(data.start, data.end)}`,
    data.accessCode ? `\n🔑 Код доступа: <code>${data.accessCode}</code>` : null,
    data.totalPrice !== undefined ? `💰 К оплате: ${data.totalPrice} ₽` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** Сообщение с кодом доступа после успешной оплаты. */
export async function sendAccessCode(
  telegramId: string | null | undefined,
  data: BookingMessageData & { rules?: string | null },
): Promise<boolean> {
  if (!telegramId) return false;
  const text = [
    '✅ <b>Оплата получена — бронь подтверждена!</b>',
    '',
    bookingBody(data),
    '',
    data.rules
      ? `📋 <i>Правила:</i> ${data.rules}`
      : '📋 <i>Код действует только на время брони.</i>',
  ].join('\n');
  return sendTelegramMessage(telegramId, text);
}

/** Напоминание с кнопками Подтвердить / Отменить / Продлить. */
export async function sendBookingReminder(
  telegramId: string | null | undefined,
  data: BookingMessageData & { bookingId: string; hoursUntil: number },
): Promise<boolean> {
  if (!telegramId) return false;
  const text = [
    `⏰ <b>Через ~${Math.round(data.hoursUntil)} ч</b> — ваша бронь:`,
    '',
    bookingBody(data),
  ].join('\n');

  const buttons: InlineButton[][] = [
    [
      { text: '✅ Подтвердить', callback_data: buildCallbackData('CONFIRM', data.bookingId) },
      { text: '❌ Отменить', callback_data: buildCallbackData('CANCEL', data.bookingId) },
    ],
    [{ text: '➕ Продлить на 1 час', callback_data: buildCallbackData('EXTEND', data.bookingId) }],
  ];
  return sendTelegramMessage(telegramId, text, buttons);
}

/** Уведомление об отмене (с процентом возврата). */
export async function sendBookingCancelled(
  telegramId: string | null | undefined,
  data: BookingMessageData & { refundPercent: number },
): Promise<boolean> {
  if (!telegramId) return false;
  const refundLine =
    data.refundPercent > 0
      ? `💳 Возврат: ${data.refundPercent}% суммы (${data.refundPercent === 100 ? 'отмена раньше, чем за 24ч' : 'отмена позже, чем за 24ч до начала'})`
      : '💳 Предоплата не производилась';
  const text = [
    '❌ <b>Бронь отменена</b>',
    '',
    bookingBody(data),
    '',
    refundLine,
  ].join('\n');
  return sendTelegramMessage(telegramId, text);
}

/** Уведомление админу о новой подтверждённой брони. */
export async function notifyAdminNewBooking(
  data: BookingMessageData & { masterName: string },
): Promise<void> {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId) return;
  const text = [
    '🆕 <b>Новая подтверждённая бронь</b>',
    '',
    `👩‍🎓 Мастер: ${data.masterName}`,
    bookingBody(data),
  ].join('\n');
  await sendTelegramMessage(adminChatId, text);
}
