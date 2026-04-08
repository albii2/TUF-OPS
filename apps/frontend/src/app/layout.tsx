import '@/styles/globals.css'

import { AuthProvider } from '@/components/auth-provider'

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
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
