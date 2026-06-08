import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { AuthProvider } from '@/components/auth-provider'

const fontClassName = 'font-sans'

export const metadata: Metadata = {
  title: 'TUF Ops',
  description: 'Internal Operations Platform for TUF Sports',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    title: 'TUF Ops',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="TUF Ops" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={fontClassName}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
