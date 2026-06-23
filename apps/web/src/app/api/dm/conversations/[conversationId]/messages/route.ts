import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { conversationId } = await params
  const cursor = new URL(req.url).searchParams.get('cursor') ?? undefined

  try {
    const result = await client.getDmEvents(conversationId, cursor)
    const messages = (result.data ?? []).map((m: any) => ({
      id: m.id,
      text: m.text ?? '',
      senderId: m.sender_id,
      isMe: m.sender_id === account.x_user_id,
      createdAt: m.created_at,
    }))
    incrementUsage(account.id, 'dm_messages')
    return NextResponse.json({
      success: true,
      data: {
        messages,
        myUserId: account.x_user_id,
        nextCursor: result.meta?.next_token,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
