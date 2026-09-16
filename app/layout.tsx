import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';

// Montserrat — бесплатный аналог Gotham Pro (фирменный шрифт BLOKS)
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BeautyWorkspace — аренда рабочих мест для бьюти-мастеров',
    template: '%s — BeautyWorkspace',
  },
  description:
    'Бронируйте парикмахерские кресла, кабинеты, маникюрные станции и залы: почасово, на день или месяц. Оплата онлайн, код доступа в Telegram.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${montserrat.variable} min-h-screen font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            richColors
            position="top-right"
            closeButton
            toastOptions={{
              className:
                'rounded-2xl border-border/70 shadow-float backdrop-blur-xl !bg-card/95 font-sans',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
