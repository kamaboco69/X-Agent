import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('line_connections')
    .select('*')
    .eq('id', id)
    .single()

  if (dbError || !data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true, data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { error: dbError } = await supabase.from('line_connections').delete().eq('id', id)

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true, data: null })
}
