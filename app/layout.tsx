import type { Metadata } from 'next'
import './globals.css'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

export const metadata: Metadata = {
  title: 'Amauta Libre — Hábitos, tareas y aprendizaje',
  description: 'Tu espacio personal para construir hábitos, organizar tus tareas y crecer. Gratis para todos.',
  icons: { icon: '/favicon.ico' },
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
