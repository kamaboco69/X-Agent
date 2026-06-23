import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { xAccountId, text, scheduledAt, mediaIds } = await req.json()
  if (!text || !scheduledAt) return NextResponse.json({ success: false, error: 'text and scheduledAt required' }, { status: 400 })

  const accountId = xAccountId ?? session!.xAccountDbId
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data, error: dbError } = await supabase
    .from('scheduled_posts')
    .insert({
      id: crypto.randomUUID(),
      x_account_id: accountId,
      text,
      media_ids: mediaIds ?? null,
      scheduled_at: scheduledAt,
      status: 'scheduled',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: {
      id: data.id, xAccountId: data.x_account_id, text: data.text,
      mediaIds: data.media_ids, scheduledAt: data.scheduled_at,
      status: data.status, postedTweetId: data.posted_tweet_id, createdAt: data.created_at,
    },
  }, { status: 201 })
}
