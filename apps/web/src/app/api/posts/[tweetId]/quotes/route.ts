import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tweetId: string }> }) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { tweetId } = await params

  try {
    const result = await client.getQuoteTweets(tweetId)
    incrementUsage(account.id, 'quote_tweets')
    return NextResponse.json({ success: true, data: result.data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
