import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { LocaleProvider } from '@/lib/i18n/LocaleContext'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Amauta Libre — App de hábitos, finanzas y metas | Soberano de tu propia vida',
  description: 'La app gratis para tomar el timón de tus días: hábitos, finanzas y metas en un solo lugar. Sin plan pago, sin tarjeta. El poder de tu voluntad, una de las cuatro soberanías del ecosistema Amauta.',
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://libre.amauta.cloud'),
  alternates: { canonical: 'https://libre.amauta.cloud' },
  appleWebApp: {
    capable: true,
    title: 'Amauta Libre',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Amauta Libre — Soberano de tu propia vida',
    description: 'El poder de tu voluntad: hábitos, finanzas y metas en un solo lugar. Gratis para siempre.',
    url: 'https://libre.amauta.cloud',
    siteName: 'Amauta Libre',
    images: [{ url: 'https://libre.amauta.cloud/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amauta Libre — Soberano de tu propia vida',
    description: 'El poder de tu voluntad: hábitos, finanzas y metas en un solo lugar. Gratis para siempre.',
    images: ['https://libre.amauta.cloud/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0514',
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale/userScalable: bloquear el zoom incumple WCAG 1.4.4.
  // El auto-zoom de iOS al enfocar inputs se evita con font-size 16px en los inputs.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={montserrat.variable}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-7991607173519932" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7991607173519932"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
        <ServiceWorkerRegister />
        <footer style={{ textAlign: 'center', padding: '8px', opacity: 0.6 }}>
          <a href="https://fazier.com/launches/libre.amauta.cloud" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width={120} alt="Fazier badge" />
          </a>
        </footer>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1341163174490585');fbq('track','PageView');`}
        </Script>
      </body>
    </html>
  )
}
