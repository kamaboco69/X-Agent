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
    .from('tags')
    .update({ ...(body.name && { name: body.name }), ...(body.color && { color: body.color }) })
    .eq('id', id)

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  await supabase.from('tags').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
