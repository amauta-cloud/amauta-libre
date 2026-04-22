import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amauta Libre',
    short_name: 'Amauta',
    description: 'Tus hábitos, tus tareas, tu crecimiento. Gratis para siempre.',
    start_url: '/tablero',
    display: 'standalone',
    background_color: '#0f0d1a',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    scope: '/',
    lang: 'es',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['health', 'lifestyle', 'productivity'],
    screenshots: [
      {
        src: '/og-image.png',
        sizes: '1200x630',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
  }
}
