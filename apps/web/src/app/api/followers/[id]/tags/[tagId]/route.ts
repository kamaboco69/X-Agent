import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; tagId: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id: followerId, tagId } = await params
  const supabase = getSupabaseAdmin()

  await supabase.from('follower_tags').delete().eq('follower_id', followerId).eq('tag_id', tagId)
  return NextResponse.json({ success: true })
}
