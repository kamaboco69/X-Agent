import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const xAccountId = searchParams.get('xAccountId') ?? session!.xAccountDbId
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const supabase = getSupabaseAdmin()
  let query = supabase.from('api_usage_logs').select('endpoint, request_count, date').eq('x_account_id', xAccountId)
  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data } = await query

  const totalRequests = (data ?? []).reduce((sum, r) => sum + r.request_count, 0)
  const totalCost = totalRequests * 0.005

  const byEndpoint: Record<string, number> = {}
  for (const row of data ?? []) {
    byEndpoint[row.endpoint] = (byEndpoint[row.endpoint] ?? 0) + row.request_count
  }

  return NextResponse.json({
    success: true,
    data: {
      totalRequests,
      totalCost,
      byEndpoint: Object.entries(byEndpoint).map(([endpoint, count]) => ({ endpoint, count })),
    },
  })
}
