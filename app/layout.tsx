import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import TopNav from './components/TopNav'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KylerOps',
  description: 'Personal AI Life OS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ background: '#000000', minHeight: '100vh', margin: 0 }}>
        <TopNav />
        {children}
      </body>
    </html>
  )
}
