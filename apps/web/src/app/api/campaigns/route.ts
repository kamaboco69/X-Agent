import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { text, mediaIds, requireLike, requireRepost, requireFollow, replyKeyword, lineIntegration } = await req.json()
  if (!text) return NextResponse.json({ success: false, error: 'text required' }, { status: 400 })

  try {
    // 1. Post the tweet
    const tweet = await client.createTweet({ text, media: mediaIds ? { media_ids: mediaIds } : undefined })

    // 2. Create the engagement gate
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()
    const gateId = crypto.randomUUID()

    const triggerType = requireLike ? 'like' : requireRepost ? 'repost' : requireFollow ? 'follow' : replyKeyword ? 'reply' : 'like'
    const tweetUrl = `https://x.com/i/web/status/${tweet.id}`

    await supabase.from('engagement_gates').insert({
      id: gateId,
      x_account_id: account.id,
      post_id: tweet.id,
      trigger_type: triggerType,
      action_type: 'verify_only',
      template: `アクション確認済み: ${tweetUrl}`,
      require_like: requireLike ?? false,
      require_repost: requireRepost ?? false,
      require_follow: requireFollow ?? false,
      reply_keyword: replyKeyword ?? null,
      is_active: true,
      polling_strategy: 'hot_window',
      api_calls_total: 0,
      created_at: now,
      updated_at: now,
    })

    return NextResponse.json({
      success: true,
      data: { tweetId: tweet.id, tweetUrl, gateId },
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
