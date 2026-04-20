'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart, Package, LayoutDashboard, ShieldCheck,
  LogOut, AlertTriangle,
} from 'lucide-react'
import { clearSession, getProducts } from '@/lib/store'
import type { Session } from '@/lib/types'
import { useState, useEffect } from 'react'

interface NavSidebarProps { session: Session }

const adminLinks = [
  { href: '/',           label: 'POS Terminal',  icon: ShoppingCart },
  { href: '/products',   label: 'Products',       icon: Package },
  { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin',      label: 'Admin',           icon: ShieldCheck },
]
const cashierLinks = [
  { href: '/', label: 'POS Terminal', icon: ShoppingCart },
]

export function NavSidebar({ session }: NavSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [lowStock, setLowStock] = useState(0)

  useEffect(() => {
    getProducts().then((products) => {
      setLowStock(products.filter((p) => p.stock <= p.lowStockThreshold).length)
    })
  }, [])

  const links = session.role === 'admin' ? adminLinks : cashierLinks

  const handleLogout = () => {
    clearSession()
    router.replace('/login')
  }

  return (
    /* Hidden on mobile (bottom nav takes over), visible from md up */
    <aside className="pos-sidebar hidden md:flex flex-col h-full shrink-0 select-none">
      {/* Logo — full on lg, icon-only placeholder on md */}
      <div className="px-3 lg:px-5 py-5 border-b border-white/5 flex items-center justify-center lg:justify-start">
        <div className="flex flex-col gap-1 items-center lg:items-start">
          <img
            src="/dark.png"
            alt="Refabit Logo"
            className="h-7 w-auto object-contain hidden lg:block"
          />
          {/* Compact icon shown when sidebar is collapsed */}
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center lg:hidden">
            <ShoppingCart size={15} className="text-white" />
          </div>
          <p className="text-white/40 text-[10px] hidden lg:block">v2.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 hidden lg:block">Menu</p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium group justify-center lg:justify-start ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={17} className={active ? 'text-white' : 'text-white/50 group-hover:text-white'} />
                {href === '/admin' && lowStock > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold lg:hidden">
                    {lowStock}
                  </span>
                )}
              </div>
              <span className="flex-1 hidden lg:block">{label}</span>
              {href === '/admin' && lowStock > 0 && (
                <span className="hidden lg:flex items-center gap-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  <AlertTriangle size={9} /> {lowStock}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Role badge — desktop only */}
      <div className="px-3 pb-2 hidden lg:block">
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Role</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            session.role === 'admin' ? 'bg-red-600/30 text-red-300' : 'bg-blue-600/30 text-blue-300'
          }`}>
            {session.role === 'admin' ? '🛡 Admin' : '🏷 Cashier'}
          </span>
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-2 lg:px-3 pb-4">
        {/* Full user card on desktop */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/8">
          <div className="w-8 h-8 rounded-full bg-red-600/40 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{session.name}</p>
            <p className="text-white/40 text-[10px] truncate">@{session.username}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-white/40 hover:text-red-400 p-1 rounded-lg hover:bg-white/8"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Icon-only logout on tablet */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="lg:hidden w-full flex items-center justify-center py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/8"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  )
}
