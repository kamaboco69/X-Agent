import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: snapshots } = await supabase
    .from('follower_snapshots')
    .select('followers_count, following_count, tweet_count, recorded_at')
    .eq('x_account_id', id)
    .order('recorded_at', { ascending: true })
    .limit(30)

  const list = snapshots ?? []
  const latest = list.length > 0 ? list[list.length - 1] : null

  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 10)
  const snap7 = list.find((s) => s.recorded_at <= d7) ?? list[0] ?? null
  const snap30 = list[0] ?? null

  return NextResponse.json({
    success: true,
    data: {
      current: latest
        ? {
            followersCount: latest.followers_count,
            followingCount: latest.following_count,
            tweetCount: latest.tweet_count,
            recordedAt: latest.recorded_at,
          }
        : null,
      history: list.map((s) => ({
        followersCount: s.followers_count,
        followingCount: s.following_count,
        tweetCount: s.tweet_count,
        recordedAt: s.recorded_at,
      })),
      growth: {
        days7: latest && snap7 ? latest.followers_count - snap7.followers_count : null,
        days30: latest && snap30 ? latest.followers_count - snap30.followers_count : null,
      },
    },
  })
}
