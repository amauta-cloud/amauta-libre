import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Amauta Libre — Tus hábitos, tus tareas, tu crecimiento.',
  description: 'App gratuita de hábitos, finanzas personales y metas. Sin plan pago. Sin tarjeta. Funciona desde el navegador de tu celular.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Amauta Libre',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Amauta Libre',
    description: 'Tus hábitos, tus tareas, tu crecimiento. Gratis para siempre.',
    url: 'https://libre.amauta.cloud',
    siteName: 'Amauta Libre',
    images: [{ url: 'https://libre.amauta.cloud/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amauta Libre',
    description: 'Tus hábitos, tus tareas, tu crecimiento. Gratis para siempre.',
    images: ['https://libre.amauta.cloud/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
