import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout/AppLayout'
import { AnimationProvider } from '@/components/providers/AnimationProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-background text-foreground font-sans">
        <AnimationProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AnimationProvider>
      </body>
    </html>
  )
}
