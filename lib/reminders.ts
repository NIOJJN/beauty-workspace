import { db } from '@/lib/db';
import { isTelegramConfigured } from '@/lib/telegram';
import { sendBookingReminder } from '@/lib/telegram-templates';
import type { ReminderStatus } from '@prisma/client';

/**
 * Напоминания о бронях (вызывается кроном через /api/reminders):
 *  - за 24ч и за 1ч до начала — Telegram с кнопками;
 *  - завершение прошедших подтверждённых броней (COMPLETED).
 */

export interface ReminderStats {
  sent24h: number;
  sent1h: number;
  completedBookings: number;
  failed: number;
  telegramConfigured: boolean;
}

interface Candidate {
  id: string;
  startTime: Date;
  hoursUntil: number;
  type: 'REMINDER_24H' | 'REMINDER_1H';
}

export async function processReminders(): Promise<ReminderStats> {
  const now = Date.now();
  const stats: ReminderStats = {
    sent24h: 0,
    sent1h: 0,
    completedBookings: 0,
    failed: 0,
    telegramConfigured: isTelegramConfigured(),
  };

  // 1. Завершаем прошедшие брони
  const completed = await db.booking.updateMany({
    where: { status: 'CONFIRMED', endTime: { lt: new Date(now) } },
    data: { status: 'COMPLETED' },
  });
  stats.completedBookings = completed.count;

  // 2. Кандидаты на напоминание: активные брони в ближайшие 25 часов
  const bookings = await db.booking.findMany({
    where: {
      status: { in: ['PAID', 'CONFIRMED'] },
      startTime: { gte: new Date(now), lte: new Date(now + 25 * 3_600_000) },
    },
    include: { user: true, space: true },
  });

  const candidates: Candidate[] = [];
  for (const booking of bookings) {
    const hoursUntil = (booking.startTime.getTime() - now) / 3_600_000;
    if (hoursUntil >= 23 && hoursUntil <= 25) {
      candidates.push({ id: booking.id, startTime: booking.startTime, hoursUntil, type: 'REMINDER_24H' });
    } else if (hoursUntil >= 0.5 && hoursUntil <= 1.5) {
      candidates.push({ id: booking.id, startTime: booking.startTime, hoursUntil, type: 'REMINDER_1H' });
    }
  }

  for (const candidate of candidates) {
    const already = await db.reminder.findUnique({
      where: { bookingId_type: { bookingId: candidate.id, type: candidate.type } },
    });
    if (already) continue;

    const booking = bookings.find((b) => b.id === candidate.id);
    if (!booking) continue;

    let status: ReminderStatus = 'FAILED';
    let error: string | null = 'Telegram не настроен или мастер не привязал аккаунт';

    if (stats.telegramConfigured && booking.user.telegramId) {
      const sent = await sendBookingReminder(booking.user.telegramId, {
        bookingId: booking.id,
        spaceName: booking.space.name,
        spaceAddress: booking.space.address,
        start: booking.startTime,
        end: booking.endTime,
        hoursUntil: candidate.hoursUntil,
      });
      if (sent) {
        status = 'SENT';
        error = null;
      } else {
        error = 'Ошибка отправки в Telegram';
      }
    }

    try {
      await db.reminder.create({
        data: {
          bookingId: candidate.id,
          type: candidate.type,
          channel: 'TELEGRAM',
          status,
          sentAt: status === 'SENT' ? new Date() : null,
          error,
        },
      });
    } catch {
      // race с другим воркером — ок
    }

    if (status === 'SENT') {
      if (candidate.type === 'REMINDER_24H') stats.sent24h += 1;
      else stats.sent1h += 1;
    } else {
      stats.failed += 1;
    }
  }

  return stats;
}
