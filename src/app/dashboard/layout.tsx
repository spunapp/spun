'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, LayoutDashboard, Megaphone, Users, TrendingUp,
  LogOut, ChevronRight, Menu, X, Building2
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/month-1', label: 'Month 1 — Campaigns', icon: Megaphone },
  { href: '/dashboard/month-2', label: 'Month 2 — Sales', icon: Users },
  { href: '/dashboard/month-3', label: 'Month 3 — ROI', icon: TrendingUp },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    async function loadBusiness() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('businesses').select('name').eq('user_id', user.id).single()
      if (data) setBusinessName(data.name)
    }
    loadBusiness()
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (item: typeof NAV[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-white/5 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Spun</span>
          </div>
          {businessName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{businessName}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive(item)
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive(item) && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">Spun</span>
          </div>
          <div className="w-5" />
        </header>
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="fixed top-4 right-4 z-40 lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
