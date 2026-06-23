'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('twitter', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">X PIX</h1>
          <p className="text-sm text-gray-400 mt-1">Xアカウント運用ダッシュボード</p>
        </div>

        {/* Sign in card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-sm text-gray-300 text-center mb-6">
            Xアカウントでサインインしてダッシュボードにアクセス
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading || status === 'loading'}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            )}
            {loading ? 'サインイン中...' : 'X でサインイン'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            サインインすることで、XのOAuth 2.0認証を使用します
          </p>
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">
          X PIX — Powered by X API v2
        </p>
      </div>
    </div>
  )
}
