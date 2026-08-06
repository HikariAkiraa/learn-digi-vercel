import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

/** Serif display face — the "classic" half of "classic elegant yet technical". */
const serifDisplay = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif-display',
});

export const metadata: Metadata = {
  title: {
    default: 'Learn Digi — Dokumentasi Praktikum Laboratorium Digital',
    template: '%s · Learn Digi',
  },
  description:
    'Modul, prosedur, dan panduan alat untuk praktikum Laboratorium Digital.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${serifDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
