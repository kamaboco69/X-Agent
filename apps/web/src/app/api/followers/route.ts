import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const xAccountId = searchParams.get('xAccountId')
  const tagId = searchParams.get('tagId')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('followers')
    .select('*, follower_tags(tag_id, tags(id, name, color))', { count: 'exact' })

  if (xAccountId) query = query.eq('x_account_id', xAccountId)
  if (tagId) query = query.eq('follower_tags.tag_id', tagId)

  const { data, count, error: dbError } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbError) return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })

  const items = (data ?? []).map((f) => ({
    id: f.id,
    xAccountId: f.x_account_id,
    xUserId: f.x_user_id,
    username: f.username,
    displayName: f.display_name,
    profileImageUrl: f.profile_image_url,
    followerCount: f.follower_count,
    followingCount: f.following_count,
    isFollowing: f.is_following,
    isFollowed: f.is_followed,
    metadata: f.metadata ?? {},
    createdAt: f.created_at,
    tags: (f.follower_tags ?? []).map((ft: any) => ft.tags).filter(Boolean),
  }))

  return NextResponse.json({
    success: true,
    data: { items, total: count ?? 0, page: Math.floor(offset / limit), limit, hasNextPage: (count ?? 0) > offset + limit },
  })
}
