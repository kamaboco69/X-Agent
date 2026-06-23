import { NextRequest, NextResponse } from 'next/server'
import { getXClientForSession } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const { client, error } = await getXClientForSession()
  if (error) return error

  const username = new URL(req.url).searchParams.get('q')
  if (!username) return NextResponse.json({ success: false, error: 'q required' }, { status: 400 })

  try {
    const user = await client.getUserByUsername(username.replace('@', ''))
    return NextResponse.json({ success: true, data: user ? [user] : [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
