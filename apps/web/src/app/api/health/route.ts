import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  return NextResponse.json({
    success: true,
    data: { status: 'ok', authenticated: !!session?.xAccountDbId },
  })
}
