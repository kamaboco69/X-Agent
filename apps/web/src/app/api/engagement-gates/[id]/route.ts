import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

function serialize(g: any) {
  return {
    id: g.id, xAccountId: g.x_account_id, postId: g.post_id,
    triggerType: g.trigger_type, actionType: g.action_type,
    template: g.template, link: g.link, isActive: g.is_active,
    lineHarnessUrl: g.line_harness_url, lineHarnessTag: g.line_harness_tag,
    lineHarnessScenarioId: g.line_harness_scenario_id,
    requireLike: g.require_like, requireRepost: g.require_repost, requireFollow: g.require_follow,
    replyKeyword: g.reply_keyword, pollingStrategy: g.polling_strategy,
    estimatedCost: `$${((g.api_calls_total ?? 0) * 0.005).toFixed(4)}`,
    createdAt: g.created_at, updatedAt: g.updated_at,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase.from('engagement_gates').select('*').eq('id', id).single()
  if (dbError || !data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: serialize(data) })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const supabase = getSupabaseAdmin()

  const updateFields: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.template !== undefined) updateFields.template = body.template
  if (body.link !== undefined) updateFields.link = body.link
  if (body.isActive !== undefined) updateFields.is_active = body.isActive
  if (body.lineHarnessUrl !== undefined) updateFields.line_harness_url = body.lineHarnessUrl
  if (body.lineHarnessTag !== undefined) updateFields.line_harness_tag = body.lineHarnessTag
  if (body.lineHarnessScenarioId !== undefined) updateFields.line_harness_scenario_id = body.lineHarnessScenarioId
  if (body.requireLike !== undefined) updateFields.require_like = body.requireLike
  if (body.requireRepost !== undefined) updateFields.require_repost = body.requireRepost
  if (body.requireFollow !== undefined) updateFields.require_follow = body.requireFollow
  if (body.replyKeyword !== undefined) updateFields.reply_keyword = body.replyKeyword
  if (body.pollingStrategy !== undefined) updateFields.polling_strategy = body.pollingStrategy

  const { data, error: dbError } = await supabase
    .from('engagement_gates').update(updateFields).eq('id', id).select().single()
  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true, data: serialize(data) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  await getSupabaseAdmin().from('engagement_gates').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
