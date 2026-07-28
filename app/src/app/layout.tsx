import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SpaceBackdrop from '@/components/SpaceBackdrop'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Orbitmap',
  description: 'Roadmap, ændringer og fejl for alle dine apps ét samlet sted',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SpaceBackdrop />
        {children}
      </body>
    </html>
  )
}
