import 'dotenv/config';
import {
  PrismaClient,
  SpaceType,
  TariffType,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed: 5 рабочих мест разных типов, 1 админ, 3 мастера,
 * тестовые брони со платежами, отзывы, блокировка слота, избранное.
 *
 * Запуск: npm run db:seed
 */

const db = new PrismaClient();

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

/** Дата через offset дней от сегодня в указанный час локального времени. */
function atHour(dayOffset: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

interface SpaceSeed {
  name: string;
  type: SpaceType;
  description: string;
  photos: string[];
  amenities: string[];
  pricePerHour: number;
  pricePerDay: number;
  pricePerMonth: number;
  address: string;
  capacity?: number;
  sundayClosed?: boolean;
}

const SPACES: SpaceSeed[] = [
  {
    name: 'Кресло у окна',
    type: SpaceType.CHAIR,
    description:
      'Светлое парикмахерское кресло у панорамного окна: зеркала в полный рост, мойка рядом, розетки у каждого рабочего места. Идеально для стрижек и окрашиваний.',
    photos: [
      unsplash('photo-1521590832167-7bcbfaa6381f'),
      unsplash('photo-1560066984-138dadb4c035'),
      unsplash('photo-1562322140-8baeececf3df'),
    ],
    amenities: [
      'Зеркало',
      'Мойка',
      'Розетки у кресла',
      'Wi-Fi',
      'Кондиционер',
      'Кофе-зона',
    ],
    pricePerHour: 300,
    pricePerDay: 2000,
    pricePerMonth: 40000,
    address: 'ул. Пушкина, 10, 2 этаж',
  },
  {
    name: 'Парикмахерское место №2',
    type: SpaceType.CHAIR,
    description:
      'Профессиональное кресло с мойкой и стерилизатором. Подходит для барберов: есть место для инструментов и свободный доступ в часы работы.',
    photos: [
      unsplash('photo-1580618672591-eb180b1a973f'),
      unsplash('photo-1521590832167-7bcbfaa6381f'),
    ],
    amenities: [
      'Зеркало',
      'Мойка',
      'Стерилизатор',
      'Wi-Fi',
      'Хранение инструментов',
    ],
    pricePerHour: 350,
    pricePerDay: 2200,
    pricePerMonth: 45000,
    address: 'ул. Пушкина, 10, 2 этаж',
  },
  {
    name: 'Кабинет для бровиста',
    type: SpaceType.CABINET,
    description:
      'Отдельный кабинет с кушеткой, кольцевой лампой и полным затемнением — идеально для бровей, ресниц и татуажа. Тихо, приватно, стерильно.',
    photos: [
      unsplash('photo-1519014816548-bf5fe059798b'),
      unsplash('photo-1516975080664-ed2fc6a32937'),
    ],
    amenities: [
      'Кушетка',
      'Кольцевая лампа',
      'Стерилизатор',
      'Wi-Fi',
      'Кондиционер',
    ],
    pricePerHour: 500,
    pricePerDay: 3200,
    pricePerMonth: 60000,
    address: 'ул. Пушкина, 10, 3 этаж, кабинет 5',
    sundayClosed: true,
  },
  {
    name: 'Маникюрная станция',
    type: SpaceType.STATION,
    description:
      'Маникюрный стол с лампой, вытяжкой и подлокотником. Рядом стерилизатор и мойка. Компактная зона для мастера с потоком клиентов.',
    photos: [
      unsplash('photo-1604654894610-df63bc536371'),
      unsplash('photo-1610992015732-2449b76344bc'),
    ],
    amenities: [
      'Вытяжка',
      'Кольцевая лампа',
      'Стерилизатор',
      'Wi-Fi',
      'Кофе-зона',
    ],
    pricePerHour: 400,
    pricePerDay: 2600,
    pricePerMonth: 52000,
    address: 'ул. Пушкина, 10, 2 этаж',
  },
  {
    name: 'Зал для визажа',
    type: SpaceType.ROOM,
    description:
      'Просторный зал с гримёрными зеркалами, профессиональным светом и фоном для фото. Подходит для визажа, фотосессий и мастер-классов до 4 человек.',
    photos: [
      unsplash('photo-1487412947147-5cebf100ffc2'),
      unsplash('photo-1522337660859-02fbefca4702'),
    ],
    amenities: [
      'Гримёрное зеркало',
      'Профессиональный свет',
      'Wi-Fi',
      'Парковка',
      'Кофе-зона',
    ],
    pricePerHour: 800,
    pricePerDay: 5000,
    pricePerMonth: 90000,
    address: 'ул. Пушкина, 10, 3 этаж',
    capacity: 4,
  },
];

async function main(): Promise<void> {
  console.log('🌱 Seed: очистка…');

  // Порядок удаления важен из-за внешних ключей
  await db.reminder.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.review.deleteMany();
  await db.favorite.deleteMany();
  await db.blockedSlot.deleteMany();
  await db.linkCode.deleteMany();
  await db.tariff.deleteMany();
  await db.schedule.deleteMany();
  await db.space.deleteMany();
  await db.user.deleteMany();

  console.log('👤 Пользователи…');
  const [anna, maria, ksenia] = await Promise.all([
    db.user.create({
      data: {
        email: 'anna@beautyworkspace.ru',
        name: 'Анна Соколова',
        phone: '+7 900 111-22-33',
        role: 'MASTER',
        passwordHash: await bcrypt.hash('master123', 12),
        specialization: 'Парикмахер',
        isVerified: true,
        telegramId: '111111111',
      },
    }),
    db.user.create({
      data: {
        email: 'maria@beautyworkspace.ru',
        name: 'Мария Бровкина',
        phone: '+7 900 222-33-44',
        role: 'MASTER',
        passwordHash: await bcrypt.hash('master123', 12),
        specialization: 'Бровист',
        isVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'ksenia@beautyworkspace.ru',
        name: 'Ксения Лаковая',
        phone: '+7 900 333-44-55',
        role: 'MASTER',
        passwordHash: await bcrypt.hash('master123', 12),
        specialization: 'Мастер маникюра',
      },
    }),
  ]);

  console.log('🏪 Рабочие места…');
  const createdSpaces = [];
  for (const seed of SPACES) {
    const space = await db.space.create({
      data: {
        name: seed.name,
        type: seed.type,
        description: seed.description,
        photos: seed.photos,
        capacity: seed.capacity ?? 1,
        amenities: seed.amenities,
        pricePerHour: seed.pricePerHour,
        pricePerDay: seed.pricePerDay,
        pricePerMonth: seed.pricePerMonth,
        bufferMinutes: 15,
        address: seed.address,
        rules:
          'Код доступа действует только на время брони. Уберите рабочее место за собой.',
        isActive: true,
        schedules: {
          create: Array.from({ length: 7 }, (_, day) => ({
            dayOfWeek: day,
            openTime: '09:00',
            closeTime: '21:00',
            isClosed: seed.sundayClosed === true && day === 0,
          })),
        },
        tariffs: {
          create: [
            { type: TariffType.HOURLY, price: seed.pricePerHour, minHours: 2, discount: 0 },
            { type: TariffType.DAILY, price: seed.pricePerDay, discount: 5 },
            { type: TariffType.MONTHLY, price: seed.pricePerMonth, discount: 10 },
          ],
        },
      },
    });
    createdSpaces.push(space);
  }

  // Админ создаётся отдельно (роль ADMIN)
  await db.user.create({
    data: {
      email: 'admin@beautyworkspace.ru',
      name: 'Алиса Админова',
      phone: '+7 900 000-00-01',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('admin123', 12),
      isVerified: true,
    },
  });

  console.log('📅 Брони и платежи…');
  const [chair, cabinet, station] = createdSpaces;

  // Прошедшая завершённая бронь с оплатой
  const pastBooking = await db.booking.create({
    data: {
      userId: anna.id,
      spaceId: chair.id,
      startTime: atHour(-3, 10),
      endTime: atHour(-3, 14),
      status: BookingStatus.COMPLETED,
      totalPrice: 1200,
      tariffType: TariffType.HOURLY,
      accessCode: '110802',
    },
  });
  await db.payment.create({
    data: {
      bookingId: pastBooking.id,
      amount: 1200,
      status: PaymentStatus.SUCCEEDED,
      yookassaId: 'seed_past_payment_1',
      metadata: { seeded: true },
    },
  });

  // Подтверждённая будущая бронь с кодом доступа и напоминанием
  const confirmedBooking = await db.booking.create({
    data: {
      userId: anna.id,
      spaceId: chair.id,
      startTime: atHour(2, 10),
      endTime: atHour(2, 16),
      status: BookingStatus.CONFIRMED,
      totalPrice: 1800,
      tariffType: TariffType.HOURLY,
      accessCode: '482913',
    },
  });
  await db.payment.create({
    data: {
      bookingId: confirmedBooking.id,
      amount: 1800,
      status: PaymentStatus.SUCCEEDED,
      yookassaId: 'seed_confirmed_payment_1',
      metadata: { seeded: true },
    },
  });
  await db.reminder.create({
    data: {
      bookingId: confirmedBooking.id,
      type: 'REMINDER_24H',
      channel: 'TELEGRAM',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  // Оплаченная бронь (waiting_for_capture)
  const paidBooking = await db.booking.create({
    data: {
      userId: maria.id,
      spaceId: cabinet.id,
      startTime: atHour(1, 9),
      endTime: atHour(1, 15),
      status: BookingStatus.PAID,
      totalPrice: 3200,
      tariffType: TariffType.DAILY,
      paymentId: 'seed_paid_payment_1',
    },
  });
  await db.payment.create({
    data: {
      bookingId: paidBooking.id,
      amount: 3200,
      status: PaymentStatus.WAITING_FOR_CAPTURED,
      yookassaId: 'seed_paid_payment_1',
      metadata: { seeded: true },
    },
  });

  // Бронь, ожидающая оплаты
  const pendingBooking = await db.booking.create({
    data: {
      userId: ksenia.id,
      spaceId: station.id,
      startTime: atHour(5, 9),
      endTime: atHour(5, 21),
      status: BookingStatus.PENDING,
      totalPrice: 2600,
      tariffType: TariffType.DAILY,
      paymentId: 'seed_pending_payment_1',
    },
  });
  await db.payment.create({
    data: {
      bookingId: pendingBooking.id,
      amount: 2600,
      status: PaymentStatus.PENDING,
      yookassaId: 'seed_pending_payment_1',
      metadata: { seeded: true },
    },
  });

  // Отменённая бронь с возвратом 100%
  const cancelledBooking = await db.booking.create({
    data: {
      userId: anna.id,
      spaceId: chair.id,
      startTime: atHour(-7, 12),
      endTime: atHour(-7, 16),
      status: BookingStatus.CANCELLED,
      totalPrice: 1200,
      tariffType: TariffType.HOURLY,
    },
  });
  await db.payment.create({
    data: {
      bookingId: cancelledBooking.id,
      amount: 1200,
      status: PaymentStatus.SUCCEEDED,
      yookassaId: 'seed_cancelled_payment_1',
      metadata: { seeded: true, refundPercent: 100, refundedAmount: 1200 },
    },
  });

  console.log('🚧 Блокировка слота…');
  await db.blockedSlot.create({
    data: {
      spaceId: chair.id,
      startTime: atHour(1, 9),
      endTime: atHour(1, 12),
      reason: 'Замена зеркала',
    },
  });

  console.log('⭐ Отзывы и избранное…');
  await db.review.createMany({
    data: [
      {
        spaceId: chair.id,
        userId: maria.id,
        rating: 5,
        comment: 'Свет отличный, клиенты в восторге. Мойка в шаговой доступности!',
      },
      {
        spaceId: chair.id,
        userId: ksenia.id,
        rating: 4,
        comment: 'Удобно, что есть буфер на уборку. Иногда шумно у окна.',
      },
      {
        spaceId: cabinet.id,
        userId: anna.id,
        rating: 5,
        comment: 'Полное затемнение — идеально для ламинирования.',
      },
    ],
  });
  await db.favorite.createMany({
    data: [
      { userId: anna.id, spaceId: cabinet.id },
      { userId: anna.id, spaceId: createdSpaces[4].id },
      { userId: ksenia.id, spaceId: chair.id },
    ],
  });

  console.log('✅ Seed завершён!');
  console.log('   Админ:   admin@beautyworkspace.ru / admin123');
  console.log('   Мастера: anna@ / maria@ / ksenia@beautyworkspace.ru / master123');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

