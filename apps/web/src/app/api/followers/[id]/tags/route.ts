import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id: followerId } = await params
  const { tagId } = await req.json()
  if (!tagId) return NextResponse.json({ success: false, error: 'tagId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { error: dbError } = await supabase.from('follower_tags').insert({
    follower_id: followerId,
    tag_id: tagId,
    created_at: new Date().toISOString(),
  })

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
