import './globals.css'
import Header from '../components/Header'

export const metadata = {
  title: 'PickCrown',
  description: 'Prediction pools for sports and entertainment',
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