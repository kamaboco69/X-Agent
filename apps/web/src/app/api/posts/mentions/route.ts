import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const session = await auth()
  const sinceId = new URL(req.url).searchParams.get('sinceId') ?? undefined

  try {
    const result = await client.getUserMentions(session!.xUserId, sinceId)
    incrementUsage(account.id, 'mentions')
    return NextResponse.json({ success: true, data: result.data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
