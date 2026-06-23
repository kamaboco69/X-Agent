import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession, incrementUsage } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const { client, account, error } = await getXClientForSession()
  if (error) return error

  const { participantId, text } = await req.json()
  if (!participantId || !text) {
    return NextResponse.json({ success: false, error: 'participantId and text required' }, { status: 400 })
  }

  try {
    const result = await client.sendDm(participantId, text)
    incrementUsage(account.id, 'dm_send')
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
