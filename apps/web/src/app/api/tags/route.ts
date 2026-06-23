import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('tags')
    .select('*')
    .eq('x_account_id', session!.xAccountDbId)
    .order('created_at')

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((t) => ({
      id: t.id, xAccountId: t.x_account_id, name: t.name, color: t.color, createdAt: t.created_at,
    })),
  })
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { name, color } = await req.json()
  if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('tags')
    .insert({
      id: crypto.randomUUID(),
      x_account_id: session!.xAccountDbId,
      name,
      color: color ?? '#7C3AED',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: { id: data.id, xAccountId: data.x_account_id, name: data.name, color: data.color, createdAt: data.created_at },
  }, { status: 201 })
}
