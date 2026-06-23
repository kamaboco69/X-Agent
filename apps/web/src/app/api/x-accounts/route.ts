import { NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { error } = await getSessionOrError()
  if (error) return error

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('x_accounts')
    .select('id, x_user_id, username, display_name, is_active, created_at')
    .order('created_at')

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  const accounts = (data ?? []).map((a) => ({
    id: a.id,
    xUserId: a.x_user_id,
    username: a.username,
    displayName: a.display_name,
    isActive: a.is_active,
    createdAt: a.created_at,
  }))

  return NextResponse.json({ success: true, data: accounts })
}

export async function POST(req: Request) {
  const { error } = await getSessionOrError()
  if (error) return error

  const body = await req.json()
  if (!body.xUserId || !body.username || !body.accessToken) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const { data, error: dbError } = await supabase
    .from('x_accounts')
    .insert({
      id,
      x_user_id: body.xUserId,
      username: body.username,
      display_name: body.displayName ?? null,
      access_token: body.accessToken,
      refresh_token: body.refreshToken ?? null,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      xUserId: data.x_user_id,
      username: data.username,
      displayName: data.display_name,
      isActive: data.is_active,
      createdAt: data.created_at,
    },
  }, { status: 201 })
}
