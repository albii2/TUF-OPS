import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint deprecated in current internal build. Use active opportunity/program workflows.' },
    { status: 410 }
  )
}
