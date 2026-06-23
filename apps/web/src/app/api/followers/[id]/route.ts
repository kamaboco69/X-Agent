import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data, error: dbError } = await supabase
    .from('followers')
    .select('*, follower_tags(tag_id, tags(id, name, color))')
    .eq('id', id)
    .single()

  if (dbError || !data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      xAccountId: data.x_account_id,
      xUserId: data.x_user_id,
      username: data.username,
      displayName: data.display_name,
      profileImageUrl: data.profile_image_url,
      followerCount: data.follower_count,
      followingCount: data.following_count,
      isFollowing: data.is_following,
      isFollowed: data.is_followed,
      metadata: data.metadata ?? {},
      createdAt: data.created_at,
      tags: (data.follower_tags ?? []).map((ft: any) => ft.tags).filter(Boolean),
    },
  })
}
