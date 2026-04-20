'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSession, initStore, clearSession } from '@/lib/store'
import { NavSidebar } from '@/components/nav-sidebar'
import type { Session } from '@/lib/types'
import { ShoppingCart, Package, LayoutDashboard, ShieldCheck, LogOut } from 'lucide-react'

const PUBLIC_ROUTES = ['/login']
const ADMIN_ONLY   = ['/products', '/dashboard', '/admin']

const adminLinks = [
  { href: '/',          label: 'POS',       icon: ShoppingCart },
  { href: '/products',  label: 'Products',  icon: Package },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin',     label: 'Admin',     icon: ShieldCheck },
]
const cashierLinks = [
  { href: '/', label: 'POS', icon: ShoppingCart },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [ready,   setReady]   = useState(false)

  useEffect(() => {
    async function bootstrap() {
      await initStore()
      const sess = getSession()

      if (PUBLIC_ROUTES.includes(pathname)) {
        if (sess) router.replace('/')
        else setReady(true)
        return
      }

      if (!sess) { router.replace('/login'); return }

      if (sess.role === 'cashier' && ADMIN_ONLY.some((r) => pathname.startsWith(r))) {
        router.replace('/')
        return
      }

      setSession(sess)
      setReady(true)
    }
    bootstrap()
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-red-500 animate-spin" />
      </div>
    )
  }

  if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-red-500 animate-spin" />
      </div>
    )
  }

  const links = session.role === 'admin' ? adminLinks : cashierLinks

  const handleLogout = () => {
    clearSession()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <NavSidebar session={session} />

      {/* Main content — add bottom padding on mobile for the bottom nav */}
      <main className="flex-1 overflow-auto bg-background pb-[60px] md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar (hidden on md+) ── */}
      <nav className="bottom-nav flex md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-red-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
        {/* Logout button — always at the right end */}
        <button
          onClick={handleLogout}
          className="flex-none w-14 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold text-white/40 hover:text-red-400 transition-colors border-l border-white/10"
        >
          <LogOut size={20} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  )
}
