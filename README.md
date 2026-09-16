# BeautyWorkspace — аренда рабочих мест для бьюти-мастеров

Production-ready платформа бронирования **рабочих мест** (не клиентов!): парикмахерские кресла, кабинеты, маникюрные станции и залы. Мастер выбирает место, бронирует часы/дни/месяц, оплачивает через ЮKassa и получает код доступа в Telegram.

## 🛠 Стек

| Слой | Технологии |
| --- | --- |
| Framework | Next.js 14 (App Router, Server Components, Server Actions-совместимые API Routes) |
| Язык | TypeScript (strict, без `any`) |
| UI | Tailwind CSS + shadcn/ui, next-themes (тёмная/светлая), sonner, framer-motion, lucide-react |
| БД | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (JWT, роли MASTER/ADMIN, bcryptjs) |
| Платежи | ЮKassa (`yookassa-api-sdk`), redirect-подтверждение, вебхуки, возвраты |
| Telegram | Bot API (fetch): доступ, напоминания с кнопками, подтверждение/отмена/продление |
| Валидация | Zod (все входные данные API и форм) |
| Состояние | Zustand (выбор слотов в календаре) |
| Прочее | date-fns, @upstash/ratelimit (+in-memory fallback), qrcode |

## ✨ Ключевые функции

- **Каталог мест** `/spaces`: карточки с фото/ценами/удобствами, фильтры по типу, цене и доступности на период; страница места с галереей, тарифами, расписанием и отзывами.
- **Бронирование** `/booking/[spaceId]`: календарь в стиле Calendly — недельная сетка часов с drag-to-select (мышь и палец), месячная сетка для тарифов «день»/«месяц», расчёт стоимости в реальном времени, автоскидки тарифов.
- **Защита от двойных броней**: `pg_advisory_xact_lock(hashtext(spaceId))` + проверка пересечений `(start < existing.end) AND (end > existing.start)` с буфером места + транзакция `SERIALIZABLE`.
- **Оплата**: `POST /api/payment` → `payments.create` (redirect, `return_url`, `metadata.bookingId`); вебхук `/api/webhooks/yookassa` (белый список IP + перепроверка статуса через API): `payment.succeeded` → бронь `CONFIRMED` + 6-значный `accessCode` + сообщение в Telegram; `payment.canceled` → `CANCELLED`. Возвраты — `refunds.create` (100% при отмене >24ч, 50% — <24ч).
- **Напоминания**: крон `/api/reminders` (каждые 15 мин) — за 24ч и за 1ч до брони, кнопки «Подтвердить / Отменить / Продлить», авто-завершение прошедших броней (`COMPLETED`).
- **Личный кабинет** `/account`: обзор, активные брони/история, оплата, отмена с расчётом возврата, продление в 1 клик, документы-платежи, избранное, привязка Telegram.
- **Админка** `/admin`: дашборд (выручка, загрузка мест %, топ мастеров, heatmap месяца), CRUD мест с расписанием и тарифами, все брони с фильтрами, верификация/блокировка мастеров, блокировки слотов.
- **Mock-режим оплаты**: без ключей ЮKassa платёж проходит локально (кнопка на `/payment/success`) — полный e2e-прогон без прод-ключей.

## 🚀 Быстрый старт

```bash
# 1. Зависимости
npm install

# 2. Настроить .env (скопируйте из примера и заполните)
cp .env.example .env
# Минимум для запуска: DATABASE_URL + NEXTAUTH_SECRET

# 3. PostgreSQL (пример через Docker)
docker run --name beauty-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=beautyworkspace -p 5432:5432 -d postgres:16

# 4. Схема БД + сид-данные
npm run db:push        # или npm run db:migrate для миграций
npm run db:seed

# 5. Запуск
npm run dev            # http://localhost:3000
```

**Тестовые аккаунты после сида:**

| Роль | Email | Пароль |
| --- | --- | --- |
| ADMIN | `admin@beautyworkspace.ru` | `admin123` |
| MASTER | `anna@beautyworkspace.ru` | `master123` |
| MASTER | `maria@beautyworkspace.ru` | `master123` |
| MASTER | `ksenia@beautyworkspace.ru` | `master123` |

У Анны привязан Telegram (`telegramId=111111111`) — для проверки сообщений подставьте свой chat id или привяжите аккаунт через `/account/telegram`.

Сид создаёт: 5 мест разных типов с тарифами и расписанием 9:00–21:00, прошедшую/подтверждённую/оплаченную/ожидающую/отменённую брони с платежами, напоминание, блокировку слота, отзывы и избранное.

## 🔐 Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | PostgreSQL |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | URL приложения и секрет JWT (`openssl rand -base64 32`) |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | Ключи ЮKassa. **Пусто = mock-режим оплаты** |
| `YOOKASSA_WEBHOOK_ALLOW_ALL` | `true` — разрешить вебхуки с любого IP (только локальная отладка) |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет заголовка `X-Telegram-Bot-Api-Secret-Token` |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat id для уведомлений о новых бронях |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username бота для страницы привязки |
| `CRON_SECRET` | Секрет крона `/api/reminders` (Bearer-токен) |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting на Redis (пусто = in-memory fallback) |
| `NEXT_PUBLIC_APP_URL` | Публичный URL (return_url, ссылки в Telegram) |

## 🔔 Интеграции (прод)

**Вебхук ЮKassa** — в личном кабинете ЮKassa → Настройки → HTTP-уведомления:
```
URL: https://ваш-домен/api/webhooks/yookassa
События: payment.succeeded, payment.canceled, payment.waiting_for_capture
```
IP ЮKassa проверяются автоматически (`185.71.76.0/27`, `77.75.153.0/25`, …), статус платежа дополнительно перепроверяется запросом в API.

**Telegram webhook** (после деплоя):
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://ваш-домен/api/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

**Крон напоминаний** — `vercel.json` уже содержит `*/15 * * * *` на `/api/reminders`
(Vercel сам подставит `Authorization: Bearer <CRON_SECRET>`). Для системного crontab:
```
*/15 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://ваш-домен/api/reminders
```

## 📁 Структура

```
app/
  (auth)/login, register      # регистрация и вход мастеров
  (public)/                   # публичная зона с хедером/футером
    page.tsx, spaces/, pricing/, about/
    booking/[spaceId]         # календарь брони места
    payment/success           # код доступа + QR
  account/                    # кабинет мастера (обзор, брони, документы, избранное, Telegram)
  admin/                      # дашборд, места, брони+heatmap, мастера, блокировки
  api/
    spaces, availability, bookings, payment, payment/mock
    webhooks/yookassa, telegram, telegram/link, reminders, favorites, blocked-slots, register
components/ calendar/ spaces/ booking/ account/ admin/ ui/ layout/
lib/       db, auth, auth-guard, booking, booking-actions, availability, pricing,
           yookassa, telegram(+templates), reminders, rate-limit, validations, dto, spaces, constants
prisma/    schema.prisma, seed.ts
store/     booking-store.ts (zustand)
middleware.ts                  # защита /account и /admin (JWT + роли)
```

## 📊 Схема данных (Prisma)

`User` (MASTER|ADMIN, telegramId, верификация/блокировка) · `Space` (CHAIR|CABINET|STATION|ROOM, буфер, фото, удобства) · `Tariff` (HOURLY|DAILY|MONTHLY, скидка, minHours) · `Booking` (PENDING→PAID→CONFIRMED→COMPLETED/CANCELLED, accessCode, paymentId) · `Payment` (ЮKassa id, статусы, metadata) · `Schedule` (7 дней, open/close) · `BlockedSlot` · `Reminder` (24H/1H) · `Review` · `Favorite` · `LinkCode` (привязка Telegram).

## 🧰 Скрипты

```bash
npm run dev         # dev-сервер
npm run build       # prisma generate + next build
npm run start       # production
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:push     # синхронизация схемы
npm run db:migrate  # dev-миграции
npm run db:seed     # тестовые данные
npm run db:studio   # Prisma Studio
```

## 🔒 Безопасность

- Пароли — bcrypt (cost 12); сессии — JWT NextAuth; роли в токене, проверка в middleware + в каждом API (`requireUser` / `requireAdmin`).
- Zod-валидация **всех** входных данных (query, body).
- Rate limiting: брони 10/мин на пользователя, регистрация 5/час на IP, payments 20/мин (Upstash Redis или in-memory fallback).
- Вебхук ЮKassa: белый список IP + обязательная перепроверка статуса через API ЮKassa.
- Мастер видит и управляет **только своими** бронями; админ — всеми.
- Возвраты идемпотентны, подтверждение оплаты идемпотентно (повторный вебхук не ломает состояние).

## 📝 Замечания

- Оплата в mock-режиме работает без ключей ЮKassa — удобно для локальной разработки и CI.
- Для DAILY/MONTHLY-тарифов место бронируется целиком на период: проверяются первый/последний день расписания, промежуточные дни не ограничены часами.
- `pg_advisory_xact_lock` требует PostgreSQL (не SQLite).
