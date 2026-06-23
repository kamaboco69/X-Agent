import { NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function GET() {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  try {
    const result = await client.getDmEvents()
    incrementUsage(account.id, 'dm_events')

    // Group events by conversation
    const convMap = new Map<string, any>()
    for (const event of result.data ?? []) {
      const convId = event.dm_conversation_id
      if (!convId) continue
      const createdAt = event.created_at ?? new Date(0).toISOString()
      if (!convMap.has(convId) || new Date(createdAt) > new Date(convMap.get(convId).lastMessageAt)) {
        convMap.set(convId, {
          conversationId: convId,
          participantId: event.sender_id ?? '',
          lastMessage: event.text ?? '',
          lastMessageAt: createdAt,
          senderId: event.sender_id ?? '',
          participantUsername: null,
          participantDisplayName: null,
          participantProfileImageUrl: null,
        })
      }
    }

    return NextResponse.json({ success: true, data: Array.from(convMap.values()) })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
