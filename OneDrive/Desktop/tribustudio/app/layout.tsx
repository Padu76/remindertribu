import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tribù Personal Training Studio - Allenati, mangia bene e vivi meglio',
  description: 'Studio di Personal Training a Verona. Lezioni individuali, di coppia e miniclass con personal trainer qualificati. Prenota la tua prima lezione con massaggio gratuito.',
  keywords: 'personal trainer verona, palestra verona, allenamento personalizzato, tribù studio, fitness verona',
  openGraph: {
    title: 'Tribù Personal Training Studio',
    description: 'Il tuo percorso di trasformazione inizia qui. Allenamenti personalizzati a Verona.',
    url: 'https://tribustudio.it',
    siteName: 'Tribù Personal Training Studio',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'it_IT',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}