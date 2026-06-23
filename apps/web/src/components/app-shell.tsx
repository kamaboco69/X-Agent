'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './layout/sidebar'
import AuthGuard from './auth-guard'
import { SidebarProvider, useSidebar } from './sidebar-context'

function Shell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main
        className="flex-1 pt-7 px-6 pb-8 overflow-auto min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 58 : 216 }}
      >
        {children}
      </main>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <Shell>{children}</Shell>
      </SidebarProvider>
    </AuthGuard>
  )
}
