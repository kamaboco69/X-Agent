import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { error } = await getSessionOrError()
  if (error) return error

  const supabase = getSupabaseAdmin()
  const { data } = await supabase.from('settings').select('key, value')
  const settings: Record<string, string> = {}
  for (const row of data ?? []) settings[row.key] = row.value
  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(req: NextRequest) {
  const { error } = await getSessionOrError()
  if (error) return error

  const body = await req.json() as Record<string, string>
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  for (const [key, value] of Object.entries(body)) {
    await supabase.from('settings').upsert({ key, value, updated_at: now }, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}
