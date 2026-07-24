import type { MetadataRoute } from 'next';

// Web App Manifest — makes the site installable as an app (PWA) on phones and
// desktops (home-screen icon, standalone fullscreen window).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MCONNECTS — Student Transport',
    short_name: 'MCONNECTS',
    description: 'Campus rides, carpool, bus schedules, and live tracking for MBU students.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f0',
    theme_color: '#a5771a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
