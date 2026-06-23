'use client'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/login') return
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, pathname, router])

  if (pathname === '/login') return <>{children}</>

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-9 h-9 border-[3px] border-gray-700 border-t-violet-500 rounded-full" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return <>{children}</>
}
