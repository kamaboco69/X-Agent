import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrError()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const xAccountId = searchParams.get('xAccountId') ?? session!.xAccountDbId
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('quote_tweets')
    .select('*')
    .eq('x_account_id', xAccountId)
    .order('discovered_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: latest } = await supabase
    .from('quote_tweets')
    .select('discovered_at')
    .eq('x_account_id', xAccountId)
    .order('discovered_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((q) => ({
      id: q.id, text: q.text, authorId: q.author_id,
      authorUsername: q.author_username, authorDisplayName: q.author_display_name,
      authorProfileImageUrl: q.author_profile_image_url, createdAt: q.created_at,
    })),
    lastSync: latest?.discovered_at ?? null,
  })
}
