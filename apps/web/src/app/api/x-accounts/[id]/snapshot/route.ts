import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError, buildXClient } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('follower_snapshots')
    .select('id')
    .eq('x_account_id', id)
    .eq('recorded_at', today)
    .single()

  if (existing) return NextResponse.json({ success: true, message: 'Already recorded today' })

  const { data: account } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (!account) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const xClient = buildXClient(account)
  const me = await xClient.getMe()
  if (!me.public_metrics) return NextResponse.json({ success: false, error: 'No metrics' }, { status: 500 })

  await supabase.from('follower_snapshots').insert({
    id: crypto.randomUUID(),
    x_account_id: id,
    followers_count: me.public_metrics.followers_count,
    following_count: me.public_metrics.following_count,
    tweet_count: me.public_metrics.tweet_count,
    recorded_at: today,
  })

  return NextResponse.json({ success: true, data: me.public_metrics })
}
