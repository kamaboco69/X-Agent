import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const cursor = searchParams.get('cursor') ?? undefined

  try {
    const result = await client.getUserTweets(account.x_user_id, Math.min(limit, 100), cursor)
    incrementUsage(account.id, 'user_tweets')
    return NextResponse.json({
      success: true,
      data: {
        items: result.data ?? [],
        nextCursor: result.meta?.next_token ?? null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
