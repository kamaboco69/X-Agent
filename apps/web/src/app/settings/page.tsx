'use client'

import { useState, useEffect } from 'react'
import { fetchApi } from '@/lib/api'
import Header from '@/components/layout/header'

interface LineConnection {
  id: string
  name: string
  worker_url: string
  api_key?: string
  created_at: string
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<LineConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [autoLoading, setAutoLoading] = useState(true)
  const [autoSaving, setAutoSaving] = useState(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: LineConnection[] }>('/api/line-connections')
      if (res.success) setConnections(res.data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadSettings = async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/api/settings')
      if (res.success) setAutoEnabled(res.data.auto_features_enabled === 'true')
    } catch { /* ignore */ }
    setAutoLoading(false)
  }

  const toggleAuto = async () => {
    const newValue = !autoEnabled
    if (newValue && !confirm(
      '⚠️ 自動機能を有効にすると X API 使用料が発生します。\n\n' +
      '・エンゲージメントゲートの自動ポーリング（$0.005/回）\n' +
      '・予約投稿の自動実行（$0.010/回）\n\n' +
      '5分ごとに課金が発生します。有効にしますか？'
    )) return
    setAutoSaving(true)
    try {
      await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ auto_features_enabled: String(newValue) }),
      })
      setAutoEnabled(newValue)
    } catch { /* ignore */ }
    setAutoSaving(false)
  }

  useEffect(() => { load(); loadSettings() }, [])

  const handleAdd = async () => {
    if (!name || !url || !apiKey) return
    setSaving(true)
    try {
      await fetchApi('/api/line-connections', {
        method: 'POST',
        body: JSON.stringify({ name, workerUrl: url.replace(/\/$/, ''), apiKey }),
      })
      setName('')
      setUrl('')
      setApiKey('')
      await load()
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await fetchApi(`/api/line-connections/${id}`, { method: 'DELETE' })
    await load()
  }

  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const handleTest = async (conn: LineConnection) => {
    setTestResults(prev => ({ ...prev, [conn.id]: '...' }))
    try {
      const full = await fetchApi<{ success: boolean; data: LineConnection }>(`/api/line-connections/${conn.id}`)
      if (!full.success || !full.data.api_key) {
        setTestResults(prev => ({ ...prev, [conn.id]: '❌ API Key が取得できません' }))
        return
      }
      const res = await fetch(`${conn.worker_url}/api/friends?limit=1`, {
        headers: { Authorization: `Bearer ${full.data.api_key}` },
      })
      setTestResults(prev => ({ ...prev, [conn.id]: res.ok ? '✅ 接続OK' : `❌ ${res.status}` }))
    } catch (err) {
      setTestResults(prev => ({ ...prev, [conn.id]: `❌ ${err}` }))
    }
  }

  return (
    <div>
      <Header title="設定" description="自動機能・L Harness 接続の管理" />

      <div className="max-w-2xl space-y-5">
        {/* 自動機能トグル */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">自動機能</p>
              <p className="text-xs text-gray-500 mt-0.5">
                エンゲージメントゲート・予約投稿の自動実行
              </p>
            </div>
            {autoLoading ? (
              <div className="w-11 h-6 bg-gray-800 rounded-full animate-pulse shrink-0" />
            ) : (
              <button
                onClick={toggleAuto}
                disabled={autoSaving}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${autoEnabled ? 'bg-violet-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoEnabled ? 'translate-x-5' : ''}`} />
              </button>
            )}
          </div>
          {!autoLoading && (
            <div className={`mt-3 p-3 rounded-xl text-xs ${autoEnabled ? 'bg-violet-950/50 border border-violet-800/40 text-violet-300' : 'bg-gray-800/60 border border-gray-700/40 text-gray-500'}`}>
              {autoEnabled
                ? '5分ごとに自動実行されます。X API 使用料が発生します（Read: $0.005/回、Write: $0.010/回）。'
                : 'オフ — cron ジョブは停止中です。API 使用料は発生しません。'}
            </div>
          )}
        </div>

        {/* 登録済み一覧 */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">L Harness 接続先</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">接続先が未登録です</p>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{conn.name}</p>
                    <p className="text-xs text-gray-500 truncate">{conn.worker_url}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {testResults[conn.id] && (
                      <span className="text-xs text-gray-400">{testResults[conn.id]}</span>
                    )}
                    <button
                      onClick={() => handleTest(conn)}
                      className="px-2.5 py-1 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:text-gray-200 hover:border-gray-600 transition-colors"
                    >
                      テスト
                    </button>
                    <button
                      onClick={() => handleDelete(conn.id)}
                      className="px-2.5 py-1 text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg hover:border-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新規追加 */}
        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">接続先を追加</p>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前（例: 本番、テスト環境）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Worker URL（例: https://line-crm-worker.workers.dev）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key（lh_xxxxxxxx）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !name || !url || !apiKey}
              className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl disabled:opacity-40 transition-colors"
            >
              {saving ? '追加中...' : '追加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
