import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { sourceTweetId } = await req.json()
  if (!sourceTweetId) return NextResponse.json({ success: false, error: 'sourceTweetId required' }, { status: 400 })

  try {
    const result = await client.getQuoteTweets(sourceTweetId)
    const quotes = result.data ?? []
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    for (const quote of quotes) {
      const author = result.includes?.users?.find((u: any) => u.id === quote.author_id)
      await supabase.from('quote_tweets').upsert({
        id: quote.id,
        source_tweet_id: sourceTweetId,
        x_account_id: account.id,
        author_id: quote.author_id,
        author_username: author?.username ?? null,
        author_display_name: author?.name ?? null,
        author_profile_image_url: author?.profile_image_url ?? null,
        text: quote.text,
        created_at: quote.created_at ?? now,
        discovered_at: now,
      }, { onConflict: 'id' })
    }

    return NextResponse.json({ success: true, data: { quotesSaved: quotes.length } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
