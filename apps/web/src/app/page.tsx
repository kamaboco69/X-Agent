'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { AccountStats, FollowerSnapshot } from '@/lib/api'
import Header from '@/components/layout/header'

interface DashboardStats {
  activeGateCount: number | null
  followerCount: number | null
  tagCount: number | null
  scheduledPostCount: number | null
  monthlyRequests: number | null
  monthlyCost: number | null
  accountStats: AccountStats | null
}

function MiniBarChart({ data }: { data: FollowerSnapshot[] }) {
  if (data.length === 0) return null
  const values = data.map((d) => d.followersCount)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-[2px] h-8 mt-2">
      {data.map((d, i) => {
        const pct = ((d.followersCount - min) / range) * 100
        return (
          <div
            key={i}
            className="flex-1 rounded-t min-w-[1px]"
            style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: '#7C3AED', opacity: 0.5 + (i / data.length) * 0.5 }}
            title={`${d.recordedAt}: ${d.followersCount.toLocaleString('ja-JP')}`}
          />
        )
      })}
    </div>
  )
}

function GrowthBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null
  const positive = value >= 0
  return (
    <span className="flex items-center gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}{value.toLocaleString('ja-JP')}
      </span>
    </span>
  )
}

interface StatCardProps {
  title: string
  value: number | null
  loading: boolean
  icon: React.ReactNode
  href: string
  accent: string
  subtitle?: string
}

function StatCard({ title, value, loading, icon, href, accent, subtitle }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block bg-gray-900 rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-all group hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      {loading ? (
        <div className="h-7 w-16 bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white tabular-nums">
          {value !== null ? value.toLocaleString('ja-JP') : '—'}
        </p>
      )}
      {subtitle && !loading && (
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      )}
    </Link>
  )
}

const quickActions = [
  { href: '/posts', label: '新規投稿', desc: '投稿を作成・スケジュール', accent: '#F59E0B', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { href: '/replies', label: 'リプライ確認', desc: 'リプライを管理・返信', accent: '#06B6D4', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
  { href: '/campaign', label: 'キャンペーン', desc: '投稿→ゲート連携を一括設定', accent: '#7C3AED', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { href: '/engagement-gates', label: 'エンゲージメントゲート', desc: 'エンゲージメント条件設定', accent: '#6366F1', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { href: '/followers', label: 'フォロワー', desc: 'フォロワーの管理・タグ付け', accent: '#8B5CF6', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/messages', label: 'DM', desc: 'ダイレクトメッセージ管理', accent: '#10B981', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activeGateCount: null, followerCount: null, tagCount: null,
    scheduledPostCount: null, monthlyRequests: null, monthlyCost: null, accountStats: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const monthStart = new Date()
        monthStart.setDate(1)
        const startDate = monthStart.toISOString().split('T')[0]

        const [gatesRes, followersRes, tagsRes, postsRes, usageRes, accountsRes] = await Promise.allSettled([
          api.engagementGates.list(),
          api.followers.list({ limit: 1 }),
          api.tags.list(),
          api.posts.listScheduled(),
          api.usage.summary({ startDate }),
          api.accounts.list(),
        ])

        let accountStats: AccountStats | null = null
        const accountId =
          (accountsRes.status === 'fulfilled' && accountsRes.value.success && accountsRes.value.data[0]?.id) || null
        if (accountId) {
          try {
            const res = await api.accounts.stats(accountId)
            if (res.success) accountStats = res.data
          } catch { /* non-blocking */ }
        }

        setStats({
          activeGateCount: gatesRes.status === 'fulfilled' && gatesRes.value.success
            ? gatesRes.value.data.filter((g) => g.isActive).length : null,
          followerCount: followersRes.status === 'fulfilled' && followersRes.value.success
            ? followersRes.value.data.total : null,
          tagCount: tagsRes.status === 'fulfilled' && tagsRes.value.success
            ? tagsRes.value.data.length : null,
          scheduledPostCount: postsRes.status === 'fulfilled' && postsRes.value.success
            ? postsRes.value.data.filter((p) => p.status === 'scheduled').length : null,
          monthlyRequests: usageRes.status === 'fulfilled' && usageRes.value.success
            ? usageRes.value.data.totalRequests : null,
          monthlyCost: usageRes.status === 'fulfilled' && usageRes.value.success
            ? usageRes.value.data.totalCost : null,
          accountStats,
        })
      } catch {
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <Header
        title={session?.username ? `ようこそ、@${session.username}` : 'ダッシュボード'}
        description="X Ops の概要"
      />

      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Follower trend bar */}
      {stats.accountStats?.current && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800/60 px-5 py-4 mb-6 flex items-center gap-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white tabular-nums">
              {stats.accountStats.current.followersCount.toLocaleString('ja-JP')}
            </span>
            <span className="text-xs text-gray-500">フォロワー</span>
          </div>
          <div className="flex items-center gap-4">
            <GrowthBadge value={stats.accountStats.growth.days7} label="7日" />
            <GrowthBadge value={stats.accountStats.growth.days30} label="30日" />
          </div>
          <div className="flex-1 max-w-[180px] ml-auto">
            <MiniBarChart data={stats.accountStats.history} />
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard title="ゲート（稼働中）" value={stats.activeGateCount} loading={loading}
          href="/engagement-gates" accent="#6366F1"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard title="フォロワー" value={stats.followerCount} loading={loading}
          href="/followers" accent="#8B5CF6"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="タグ" value={stats.tagCount} loading={loading}
          href="/tags" accent="#7C3AED"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
        <StatCard title="予約投稿" value={stats.scheduledPostCount} loading={loading}
          href="/posts" accent="#F59E0B"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="今月のAPIリクエスト" value={stats.monthlyRequests} loading={loading}
          href="/usage" accent="#10B981"
          subtitle={stats.monthlyCost !== null ? `推定コスト: $${stats.monthlyCost.toFixed(4)}` : undefined}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800/60 p-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-800/60 hover:border-gray-700 hover:bg-gray-800/40 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: a.accent }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors truncate">{a.label}</p>
                <p className="text-[11px] text-gray-500 truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
