import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { text, mediaIds, quoteTweetId } = await req.json()
  if (!text) return NextResponse.json({ success: false, error: 'text required' }, { status: 400 })

  try {
    const tweet = await client.createTweet({
      text,
      media: mediaIds ? { media_ids: mediaIds } : undefined,
      quote_tweet_id: quoteTweetId,
    })
    incrementUsage(account.id, 'create_tweet')
    return NextResponse.json({ success: true, data: tweet }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message ?? 'Failed to create tweet' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const tweetId = new URL(req.url).searchParams.get('tweetId')
  if (!tweetId) return NextResponse.json({ success: false, error: 'tweetId required' }, { status: 400 })

  try {
    await client.deleteTweet(tweetId)
    incrementUsage(account.id, 'delete_tweet')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
