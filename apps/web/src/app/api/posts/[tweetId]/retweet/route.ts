import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ tweetId: string }> }) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { tweetId } = await params

  try {
    await client.retweet(account.x_user_id, tweetId)
    incrementUsage(account.id, 'retweet')

    const supabase = getSupabaseAdmin()
    await supabase.from('engagement_actions').upsert({
      id: crypto.randomUUID(),
      x_account_id: account.id,
      tweet_id: tweetId,
      action_type: 'repost',
      created_at: new Date().toISOString(),
    }, { onConflict: 'x_account_id,tweet_id,action_type', ignoreDuplicates: true })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
