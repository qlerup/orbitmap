import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SpaceBackdrop from '@/components/SpaceBackdrop'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Orbitmap',
  icons: {
    icon: '/favicon.ico?v=brand-20261005',
    apple: '/apple-touch-icon.png?v=brand-20261005',
  },
  manifest: '/site.webmanifest?v=brand-20261005',
  description: 'Roadmap, ændringer og fejl for alle dine apps ét samlet sted',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SpaceBackdrop />
        <link rel="stylesheet" href="/hub-session.css?v=1" />
        <Script src="/hub-session.js?v=1" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  )
}
