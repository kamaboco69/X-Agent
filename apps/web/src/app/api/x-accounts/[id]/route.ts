import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const supabase = getSupabaseAdmin()

  const { error: dbError } = await supabase
    .from('x_accounts')
    .update({
      ...(body.accessToken !== undefined && { access_token: body.accessToken }),
      ...(body.refreshToken !== undefined && { refresh_token: body.refreshToken }),
      ...(body.isActive !== undefined && { is_active: body.isActive }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
