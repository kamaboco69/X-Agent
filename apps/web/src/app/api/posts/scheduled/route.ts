import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const xAccountId = new URL(req.url).searchParams.get('xAccountId') ?? session!.xAccountDbId
  const supabase = getSupabaseAdmin()

  const { data, error: dbError } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('x_account_id', xAccountId)
    .order('scheduled_at')

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((p) => ({
      id: p.id, xAccountId: p.x_account_id, text: p.text,
      mediaIds: p.media_ids ?? null, scheduledAt: p.scheduled_at,
      status: p.status, postedTweetId: p.posted_tweet_id, createdAt: p.created_at,
    })),
  })
}
