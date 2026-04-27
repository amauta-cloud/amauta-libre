import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
      <head>
        <meta name="google-adsense-account" content="ca-pub-7991607173519932" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7991607173519932"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
        <ServiceWorkerRegister />
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1341163174490585');fbq('track','PageView');`}
        </Script>
      </body>
    </html>
  )
}
