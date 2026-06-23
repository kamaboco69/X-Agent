import { NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('engagement_gates')
    .select('id, post_id, trigger_type, api_calls_total')
    .eq('x_account_id', session!.xAccountDbId)

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((g) => ({
      id: g.id,
      postId: g.post_id,
      triggerType: g.trigger_type,
      apiCallsTotal: g.api_calls_total ?? 0,
      estimatedCost: (g.api_calls_total ?? 0) * 0.005,
    })),
  })
}
