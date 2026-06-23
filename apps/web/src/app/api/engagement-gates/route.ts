import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

function serialize(g: any) {
  return {
    id: g.id,
    xAccountId: g.x_account_id,
    postId: g.post_id,
    triggerType: g.trigger_type,
    actionType: g.action_type,
    template: g.template,
    link: g.link,
    isActive: g.is_active,
    lineHarnessUrl: g.line_harness_url,
    lineHarnessTag: g.line_harness_tag,
    lineHarnessScenarioId: g.line_harness_scenario_id,
    requireLike: g.require_like,
    requireRepost: g.require_repost,
    requireFollow: g.require_follow,
    replyKeyword: g.reply_keyword,
    pollingStrategy: g.polling_strategy,
    estimatedCost: `$${((g.api_calls_total ?? 0) * 0.005).toFixed(4)}`,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }
}

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const xAccountId = new URL(req.url).searchParams.get('xAccountId') ?? session!.xAccountDbId
  const supabase = getSupabaseAdmin()

  const { data, error: dbError } = await supabase
    .from('engagement_gates')
    .select('*')
    .eq('x_account_id', xAccountId)
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, data: (data ?? []).map(serialize) })
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const body = await req.json()
  if (!body.postId || !body.triggerType || !body.actionType || !body.template) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data, error: dbError } = await supabase
    .from('engagement_gates')
    .insert({
      id: crypto.randomUUID(),
      x_account_id: body.xAccountId ?? session!.xAccountDbId,
      post_id: body.postId,
      trigger_type: body.triggerType,
      action_type: body.actionType,
      template: body.template,
      link: body.link ?? null,
      is_active: true,
      line_harness_url: body.lineHarnessUrl ?? null,
      line_harness_api_key: body.lineHarnessApiKey ?? null,
      line_harness_tag: body.lineHarnessTag ?? null,
      line_harness_scenario_id: body.lineHarnessScenarioId ?? null,
      require_like: body.requireLike ?? false,
      require_repost: body.requireRepost ?? false,
      require_follow: body.requireFollow ?? false,
      reply_keyword: body.replyKeyword ?? null,
      polling_strategy: body.pollingStrategy ?? 'hot_window',
      api_calls_total: 0,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, data: serialize(data) }, { status: 201 })
}
