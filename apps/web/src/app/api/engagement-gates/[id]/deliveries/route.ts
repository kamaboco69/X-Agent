import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('engagement_gate_deliveries')
    .select('*')
    .eq('gate_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((d) => ({
      id: d.id, gateId: d.gate_id, xUserId: d.x_user_id,
      xUsername: d.x_username, deliveredPostId: d.delivered_post_id,
      status: d.status, createdAt: d.created_at,
    })),
  })
}
