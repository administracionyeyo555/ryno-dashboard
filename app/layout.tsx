import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout/AppLayout'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'RYNO - Control Center',
  description: 'Sistema de monitoreo RYNO',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased bg-background text-foreground font-sans">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
