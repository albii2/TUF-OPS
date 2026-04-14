import '@/styles/globals.css'
import { Inter } from 'next/font/google'

import { AuthProvider } from '@/components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TUF Ops',
  description: 'Internal Operations Platform for TUF Sports',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>

          {children}
        </AuthProvider>
      </body>
    </html>
  )
}