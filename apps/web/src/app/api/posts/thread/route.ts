import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { texts, mediaIds } = await req.json()
  if (!texts || texts.length === 0) return NextResponse.json({ success: false, error: 'texts required' }, { status: 400 })

  try {
    const tweets = []
    let replyToId: string | undefined

    for (let i = 0; i < texts.length; i++) {
      const tweet = await client.createTweet({
        text: texts[i],
        reply: replyToId ? { in_reply_to_tweet_id: replyToId } : undefined,
        media: i === 0 && mediaIds ? { media_ids: mediaIds } : undefined,
      })
      tweets.push(tweet)
      replyToId = tweet.id
    }

    incrementUsage(account.id, 'thread')
    return NextResponse.json({ success: true, data: tweets }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
