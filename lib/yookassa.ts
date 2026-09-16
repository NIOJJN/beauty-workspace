import { YooKassa, CurrencyEnum } from 'yookassa-api-sdk';

/**
 * Тонкая обёртка над yookassa-api-sdk.
 * Всё приложение работает только с этим модулем — SDK изолирован здесь.
 * Если ключи не заданы, приложение работает в MOCK-режиме оплаты.
 */

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

export const isYooKassaConfigured = (): boolean =>
  Boolean(SHOP_ID && SECRET_KEY);

export const isMockPaymentMode = (): boolean => !isYooKassaConfigured();

type YooKassaSdk = ReturnType<typeof YooKassa>;

let sdkInstance: YooKassaSdk | null = null;

function getSdk(): YooKassaSdk {
  if (!isYooKassaConfigured()) {
    throw new Error(
      'ЮKassa не настроена: задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY',
    );
  }
  if (!sdkInstance) {
    sdkInstance = YooKassa({
      shop_id: SHOP_ID as string,
      secret_key: SECRET_KEY as string,
    });
  }
  return sdkInstance;
}

export interface YooPaymentInfo {
  id: string;
  status: string;
  confirmationUrl: string | null;
  metadata: Record<string, string>;
}

function extractConfirmationUrl(
  confirmation: unknown,
): string | null {
  if (
    confirmation &&
    typeof confirmation === 'object' &&
    'confirmation_url' in confirmation
  ) {
    const url = (confirmation as { confirmation_url?: unknown }).confirmation_url;
    return typeof url === 'string' ? url : null;
  }
  return null;
}

function extractMetadata(metadata: unknown): Record<string, string> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') result[key] = value;
      else if (value !== null && value !== undefined) result[key] = String(value);
    }
    return result;
  }
  return {};
}

export interface CreatePaymentParams {
  /** Сумма в рублях */
  amount: number;
  description: string;
  /** URL возврата после оплаты */
  returnUrl: string;
  bookingId: string;
  customerEmail?: string | null;
}

/** Создать платёж ЮKassa с redirect-подтверждением. */
export async function createYooKassaPayment(
  params: CreatePaymentParams,
): Promise<YooPaymentInfo> {
  const sdk = getSdk();
  try {
    const payment = await sdk.payments.create({
      amount: { value: params.amount.toFixed(2), currency: CurrencyEnum.RUB },
      capture: true,
      confirmation: { type: 'redirect', return_url: params.returnUrl },
      description: params.description.slice(0, 128),
      metadata: { bookingId: params.bookingId },
    });
    return {
      id: payment.id,
      status: payment.status,
      confirmationUrl: extractConfirmationUrl(payment.confirmation),
      metadata: extractMetadata(payment.metadata),
    };
  } catch (error) {
    console.error('[yookassa] Ошибка создания платежа:', error);
    throw new Error('Не удалось создать платёж в ЮKassa. Попробуйте позже.');
  }
}

/** Получить актуальный статус платежа (защита от подделки вебхуков). */
export async function getYooKassaPayment(id: string): Promise<YooPaymentInfo> {
  const sdk = getSdk();
  const payment = await sdk.payments.load(id);
  return {
    id: payment.id,
    status: payment.status,
    confirmationUrl: extractConfirmationUrl(payment.confirmation),
    metadata: extractMetadata(payment.metadata),
  };
}

/** Создать возврат (при отмене брони). */
export async function createYooKassaRefund(params: {
  paymentId: string;
  amount: number;
}): Promise<{ id: string; status: string }> {
  const sdk = getSdk();
  const refund = await sdk.refunds.create({
    payment_id: params.paymentId,
    amount: { value: params.amount.toFixed(2), currency: CurrencyEnum.RUB },
  });
  return { id: refund.id, status: refund.status };
}

// ============ Белый список IP вебхуков ЮKassa ============

const YOOKASSA_IP_RANGES = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11/32',
  '77.75.156.35/32',
  '77.75.154.128/25',
];

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) return null;
    result = result * 256 + num;
  }
  return result >>> 0;
}

/** Проверка, что уведомление пришло с доверенного IP ЮKassa. */
export function isTrustedYooKassaIp(ip: string): boolean {
  if (process.env.YOOKASSA_WEBHOOK_ALLOW_ALL === 'true') return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return process.env.NODE_ENV !== 'production';
  }
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false; // IPv6 из диапазона 2a02:5180::/32 не проверяем

  for (const range of YOOKASSA_IP_RANGES) {
    const [network, bitsStr] = range.split('/');
    const bits = Number(bitsStr);
    const networkInt = network ? ipToInt(network) : null;
    if (networkInt === null || bits === undefined) continue;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if ((ipInt & mask) === (networkInt & mask)) return true;
  }
  return false;
}
