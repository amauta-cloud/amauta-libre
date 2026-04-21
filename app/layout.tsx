import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

export const metadata: Metadata = {
  title: 'Amauta Libre · Hábitos, tareas y aprendizaje',
  description: 'Tu espacio personal para construir hábitos, organizar tus tareas y crecer. Gratis para todos.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    title: 'Amauta Libre',
    description: 'Tus hábitos, tus tareas, tu crecimiento. Gratis para siempre.',
    images: [{ url: '/og-image.png', width: 512, height: 512 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ minHeight: '100vh', background: '#0f0d1a', color: '#f9fafb' }}>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  )
}
