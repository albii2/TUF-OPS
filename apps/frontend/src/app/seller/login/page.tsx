import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSellerSession } from '@/lib/kickz/auth'

async function loginSeller(formData: FormData) {
  'use server'

  const password = String(formData.get('password') ?? '')
  const result = await createSellerSession(password)

  if (!result.ok) {
    redirect('/seller/login?error=1')
  }

  redirect('/seller/calendar')
}

export default async function SellerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-neutral-400">KICKZ DROP SYSTEM</p>
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-2xl">Seller Login</CardTitle>
            <CardDescription>Enter your control panel passcode.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginSeller} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Passcode</Label>
                <Input id="password" name="password" type="password" required className="bg-neutral-950" />
              </div>
              {params.error ? <p className="text-sm text-red-400">Invalid passcode. Try again.</p> : null}
              <Button className="w-full">Enter Seller Panel</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
