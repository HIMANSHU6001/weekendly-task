import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import PWAInstallModal from '@/components/pwa/InstallPrompt';

export const metadata: Metadata = {
  title: 'Weekendly',
  description: 'Create your weekend plans',
  openGraph: {
    title: 'Weekendly',
    description: 'Create your weekend plans',
    url: 'https://weekendly-task.vercel.app/',
    siteName: 'Weekendly',
    images: [
      {
        url: 'https://res.cloudinary.com/diwmwhu0x/image/upload/v1757438694/weekendly_OG_Image_pdge1n.jpg',
        width: 1200,
        height: 630,
        alt: 'Weekendly OpenGraph Image',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weekendly',
    description: 'Create your weekend plans',
    images: [
      'https://res.cloudinary.com/diwmwhu0x/image/upload/v1757438694/weekendly_OG_Image_pdge1n.jpg',
    ],
  },
  metadataBase: new URL('https://weekendly-task.vercel.app/'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Weekendly',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <link rel="manifest" href="/manifest.json" />
      <meta name="application-name" content="Weekendly" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Weekendly" />
      <meta name="description" content="Create weekend plans easily" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#000000" />

      <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/web-app-manifest-192x192.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/web-app-manifest-192x192.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/web-app-manifest-192x192.png" />

      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <title>Weekendly</title>
    </head>
    <body className="font-body antialiased">
    <AuthProvider>
      <PWAInstallModal />
      {children}
      <Toaster />
    </AuthProvider>
    </body>
    </html>
  );
}
