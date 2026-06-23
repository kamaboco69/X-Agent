import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { Session } from 'next-auth'

export async function GET() {
  const session = (await auth()) as Session | null
  return NextResponse.json({
    success: true,
    data: { status: 'ok', authenticated: !!session?.xAccountDbId },
  })
}
