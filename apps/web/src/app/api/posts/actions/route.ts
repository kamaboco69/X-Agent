import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { tweetIds } = await req.json()
  if (!tweetIds || tweetIds.length === 0) return NextResponse.json({ success: true, data: {} })

  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('engagement_actions')
    .select('tweet_id, action_type')
    .eq('x_account_id', session.xAccountDbId)
    .in('tweet_id', tweetIds)

  const result: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!result[row.tweet_id]) result[row.tweet_id] = []
    result[row.tweet_id].push(row.action_type)
  }

  return NextResponse.json({ success: true, data: result })
}
