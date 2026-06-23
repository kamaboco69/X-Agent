import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { tweetIds } = await req.json()
  if (!tweetIds || tweetIds.length === 0) return NextResponse.json({ success: true, data: {} })

  const session = await auth()
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('engagement_actions')
    .select('tweet_id, action_type')
    .eq('x_account_id', session!.xAccountDbId)
    .in('tweet_id', tweetIds)

  const result: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!result[row.tweet_id]) result[row.tweet_id] = []
    result[row.tweet_id].push(row.action_type)
  }

  return NextResponse.json({ success: true, data: result })
}
