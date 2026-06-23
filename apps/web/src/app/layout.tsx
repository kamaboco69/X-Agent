import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/app-shell'
import NextAuthSessionProvider from '@/components/session-provider'

export const metadata: Metadata = {
  title: 'X PIX',
  description: 'Xアカウント運用ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 antialiased" style={{ fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif" }}>
        <NextAuthSessionProvider>
          <AppShell>
            {children}
          </AppShell>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
