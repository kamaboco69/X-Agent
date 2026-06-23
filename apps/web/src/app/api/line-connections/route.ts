import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET(_req: NextRequest) {
  const { error } = await getSessionOrError()
  if (error) return error

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('line_connections')
    .select('id, name, worker_url, created_at')
    .order('created_at', { ascending: true })

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { error } = await getSessionOrError()
  if (error) return error

  const body = await req.json()
  const { name, workerUrl, apiKey } = body as { name?: string; workerUrl?: string; apiKey?: string }
  if (!name || !workerUrl || !apiKey) {
    return NextResponse.json({ success: false, error: 'name, workerUrl, apiKey are required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error: dbError } = await supabase
    .from('line_connections')
    .insert({ id: randomUUID(), name, worker_url: workerUrl, api_key: apiKey })
    .select('id, name, worker_url, created_at')
    .single()

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true, data })
}
