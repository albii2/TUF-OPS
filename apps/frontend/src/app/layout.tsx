import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
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
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}