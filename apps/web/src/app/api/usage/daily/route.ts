import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const xAccountId = searchParams.get('xAccountId') ?? session!.xAccountDbId
  const days = parseInt(searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('api_usage_logs')
    .select('date, request_count')
    .eq('x_account_id', xAccountId)
    .gte('date', since)
    .order('date')

  const byDate: Record<string, number> = {}
  for (const row of data ?? []) {
    byDate[row.date] = (byDate[row.date] ?? 0) + row.request_count
  }

  return NextResponse.json({
    success: true,
    data: Object.entries(byDate).map(([date, count]) => ({ date, count })),
  })
}
