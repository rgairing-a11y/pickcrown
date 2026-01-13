import './globals.css'
import Header from '../components/Header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PickCrown — Prediction Pools',
  description: 'A simple, no-nonsense prediction pool for sharing picks with friends — no accounts, no clutter.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'PickCrown — Prediction Pools',
    description: 'Built for playoffs, wrestling events, awards shows, and anything else worth arguing about.',
    url: 'https://pickcrown.vercel.app',
    siteName: 'PickCrown',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PickCrown — Prediction Pools',
    description: 'A simple, no-nonsense prediction pool for sharing picks with friends.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main style={{ padding: '0 16px 48px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}