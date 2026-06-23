'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { XAccount } from '@/lib/api'
import Header from '@/components/layout/header'

export default function AccountsPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<XAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snapshotLoading, setSnapshotLoading] = useState<string | null>(null)
  const [snapshotMsg, setSnapshotMsg] = useState('')

  useEffect(() => {
    api.accounts.list()
      .then((res) => { if (res.success) setAccounts(res.data) })
      .catch(() => setError('アカウントの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  const handleSnapshot = async (id: string) => {
    setSnapshotLoading(id)
    setSnapshotMsg('')
    try {
      await api.accounts.snapshot(id)
      setSnapshotMsg('フォロワースナップショットを記録しました')
    } catch (e: any) {
      setSnapshotMsg(`エラー: ${e.message}`)
    } finally {
      setSnapshotLoading(null)
    }
  }

  return (
    <div>
      <Header title="アカウント" description="X OAuth 2.0で連携されたアカウント" />

      {error && (
        <div className="mb-4 p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">{error}</div>
      )}
      {snapshotMsg && (
        <div className="mb-4 p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-400 text-sm">{snapshotMsg}</div>
      )}

      {/* Current session info */}
      {session && (
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">現在のセッション</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">@{session.username}</p>
              <p className="text-xs text-gray-500 mt-0.5">X ID: {session.xUserId}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 text-xs font-semibold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                OAuth 2.0 認証済み
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800/60 p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800/60 p-12 text-center">
          <p className="text-gray-500 text-sm">アカウントが見つかりません。一度サインアウトして再ログインしてください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="bg-gray-900 rounded-2xl border border-gray-800/60 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-sm">@{account.username}</p>
                  {account.displayName && (
                    <p className="text-gray-400 text-xs mt-0.5">{account.displayName}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  account.isActive
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {account.isActive ? 'アクティブ' : '無効'}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mb-4 truncate">ID: {account.xUserId}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {new Date(account.createdAt).toLocaleDateString('ja-JP')} 追加
                </p>
                <button
                  onClick={() => handleSnapshot(account.id)}
                  disabled={snapshotLoading === account.id}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
                >
                  {snapshotLoading === account.id ? '記録中...' : 'スナップショット記録'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note about OAuth */}
      <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800/60 rounded-xl text-xs text-gray-500">
        アカウントの追加・切り替えはX OAuth 2.0で行います。
        別のアカウントを追加するには、一度サインアウトして別のXアカウントでサインインしてください。
      </div>
    </div>
  )
}
