import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'
import { auth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ tweetId: string }> }) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const session = await auth()
  const { tweetId } = await params

  try {
    await client.likeTweet(session!.xUserId, tweetId)
    incrementUsage(account.id, 'like')

    const supabase = getSupabaseAdmin()
    await supabase.from('engagement_actions').insert({
      id: crypto.randomUUID(),
      x_account_id: account.id,
      tweet_id: tweetId,
      action_type: 'like',
      created_at: new Date().toISOString(),
    }).onConflict('x_account_id,tweet_id,action_type' as any).ignore()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
