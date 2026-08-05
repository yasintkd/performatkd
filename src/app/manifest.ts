import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PerformaTKD | Performans Takip Sistemi',
    short_name: 'PerformaTKD',
    description: 'Veriyi Vuruşa Dönüştür',
    start_url: '/?v=2',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}