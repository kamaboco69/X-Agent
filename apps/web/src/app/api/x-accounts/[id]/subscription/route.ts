import { NextRequest, NextResponse } from 'next/server'
import { getSessionOrError, buildXClient } from '@/lib/api-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getSessionOrError()
  if (error) return error

  const { id } = await params
  const supabase = getSupabaseAdmin()
  const { data: account } = await supabase.from('x_accounts').select('*').eq('id', id).single()
  if (!account) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  try {
    const xClient = buildXClient(account)
    const me = await xClient.getMe()
    return NextResponse.json({
      success: true,
      data: {
        subscriptionType: (me as any)?.subscription_type ?? 'basic',
        verifiedType: (me as any)?.verified_type ?? 'none',
        charLimit: (me as any)?.subscription_type === 'Premium Plus' ? 25000 : 280,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
