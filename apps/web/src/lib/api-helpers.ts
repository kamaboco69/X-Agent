import { auth } from './auth'
import { getSupabaseAdmin } from './supabase'
import { XClient } from '@x-harness/x-sdk'
import { NextResponse } from 'next/server'

export interface XAccount {
  id: string
  x_user_id: string
  username: string
  display_name: string | null
  access_token: string
  refresh_token: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getSessionOrError(): Promise<
  { session: Awaited<ReturnType<typeof auth>>; error: null } |
  { session: null; error: NextResponse }
> {
  const session = await auth()
  if (!session?.xAccountDbId) {
    return { session: null, error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, error: null }
}

export async function getXAccountForSession(): Promise<XAccount | null> {
  const session = await auth()
  if (!session?.xAccountDbId) return null
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', session.xAccountDbId)
    .single()
  return data as XAccount | null
}

export function buildXClient(account: XAccount): XClient {
  return new XClient(account.access_token)
}

export async function getXClientForSession(): Promise<
  { client: XClient; account: XAccount; error: null } |
  { client: null; account: null; error: NextResponse }
> {
  const account = await getXAccountForSession()
  if (!account) {
    return {
      client: null,
      account: null,
      error: NextResponse.json({ success: false, error: 'X account not found. Please sign in again.' }, { status: 401 }),
    }
  }
  return { client: buildXClient(account), account, error: null }
}

export async function incrementUsage(xAccountId: string, endpoint: string) {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  await supabase.rpc('increment_api_usage', {
    p_x_account_id: xAccountId,
    p_endpoint: endpoint,
    p_date: today,
  }).catch(() => {
    // Non-blocking: fall back to manual upsert if RPC doesn't exist
    supabase.from('api_usage_logs')
      .upsert({
        id: crypto.randomUUID(),
        x_account_id: xAccountId,
        endpoint,
        request_count: 1,
        date: today,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'x_account_id,endpoint,date',
        ignoreDuplicates: false,
      })
      .then(() => {})
      .catch(() => {})
  })
}
