'use client'

/**
 * X OAuth 2.0 対応: サインインユーザー = Xアカウント。
 * アカウントIDはNextAuthセッション (xAccountDbId) から取得。
 * 旧来の localStorage ベースのアカウント選択は廃止。
 */

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { XAccount } from '@/lib/api'

export function useSelectedAccount() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<XAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.accounts.list()
      .then((res) => { if (res.success) setAccounts(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectedAccountId = session?.xAccountDbId ?? ''
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null

  return {
    accounts,
    loading,
    selectedAccountId,
    selectedAccount,
    setSelectedAccountId: (_id: string) => {},
  }
}

export function useCurrentAccountId(): string {
  const { data: session } = useSession()
  return session?.xAccountDbId ?? ''
}
