import './globals.css'
import { Inter } from 'next/font/google'
import Providers from '@/lib/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UpStarter - Trasforma le tue idee in startup di successo',
  description: 'La piattaforma evolutiva per validare idee startup, trovare co-founder e ottenere feedback AI personalizzato',
  keywords: 'startup, imprenditoria, business plan, co-founder, investitori, validazione idee',
  authors: [{ name: 'UpStarter Team' }],
  creator: 'UpStarter',
  publisher: 'UpStarter',
  openGraph: {
    title: 'UpStarter - Trasforma le tue idee in startup di successo',
    description: 'La piattaforma evolutiva per validare idee startup, trovare co-founder e ottenere feedback AI personalizzato',
    url: 'https://upstarter.vercel.app',
    siteName: 'UpStarter',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UpStarter - Trasforma le tue idee in startup di successo',
    description: 'La piattaforma evolutiva per validare idee startup, trovare co-founder e ottenere feedback AI personalizzato',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}