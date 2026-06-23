import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ tweetId: string }> }) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { tweetId } = await params
  const { text } = await req.json()
  if (!text) return NextResponse.json({ success: false, error: 'text required' }, { status: 400 })

  try {
    const tweet = await client.createTweet({ text, reply: { in_reply_to_tweet_id: tweetId } })
    incrementUsage(account.id, 'reply')
    return NextResponse.json({ success: true, data: tweet })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
