'use client'

import { useState, useEffect } from 'react'
import { calculateStats, calculateDailyRevenue, calculateTopProducts, calculatePaymentBreakdown, getTransactions } from '@/lib/store'
import { formatKES, DEPARTMENTS } from '@/lib/pos-utils'
import { TrendingUp, ShoppingBag, Calendar, DollarSign, Receipt } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { SaleTransaction } from '@/lib/types'

const PIE_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#ea7600']

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-primary font-bold">{formatKES(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]       = useState<ReturnType<typeof calculateStats> | null>(null)
  const [daily, setDaily]       = useState<{ date: string; revenue: number; count: number }[]>([])
  const [topProds, setTopProds] = useState<{ name: string; revenue: number; quantity: number }[]>([])
  const [payBreak, setPayBreak] = useState<{ name: string; value: number }[]>([])
  const [recent, setRecent]     = useState<SaleTransaction[]>([])
  const [allTxs, setAllTxs]     = useState<SaleTransaction[]>([])
  const [department, setDepartment] = useState<string>('All')

  useEffect(() => {
    getTransactions().then(setAllTxs)
  }, [])

  useEffect(() => {
    const filteredTxs = department === 'All' ? allTxs : allTxs.filter(t => t.department === department)
    setStats(calculateStats(filteredTxs))
    setDaily(calculateDailyRevenue(filteredTxs, 30))
    setTopProds(calculateTopProducts(filteredTxs, 6))
    setPayBreak(calculatePaymentBreakdown(filteredTxs))
    setRecent(filteredTxs.slice(0, 10))
  }, [allTxs, department])

  const chartData = daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    count: d.count,
  }))

  if (!stats) return null

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Sales analytics and performance overview</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {['All', ...DEPARTMENTS].map(dept => (
            <button key={dept} onClick={() => setDepartment(dept)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                department === dept ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {dept === 'All' ? 'All Shops' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Today's Revenue" value={formatKES(stats.todayTotal)}
          sub={`${stats.todayCount} transaction${stats.todayCount !== 1 ? 's' : ''}`}
          icon={DollarSign} color="bg-red-500" />
        <StatCard label="This Week" value={formatKES(stats.weekTotal)}
          sub={`${stats.weekCount} transactions`}
          icon={TrendingUp} color="bg-blue-500" />
        <StatCard label="This Month" value={formatKES(stats.monthTotal)}
          sub={`${stats.monthCount} transactions`}
          icon={Calendar} color="bg-purple-500" />
        <StatCard label="All Time" value={formatKES(stats.allTimeTotal)}
          sub={`${stats.count} total transactions`}
          icon={ShoppingBag} color="bg-emerald-500" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-bold text-base mb-1">Revenue — Last 30 Days</h2>
        <p className="text-muted-foreground text-xs mb-5">Daily revenue trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={2}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#dc2626' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="xl:col-span-2 bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-base mb-1">Top Products</h2>
          <p className="text-muted-foreground text-xs mb-5">Best sellers by revenue</p>
          {topProds.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProds} margin={{ top: 0, right: 10, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar dataKey="revenue" fill="#dc2626" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-base mb-1">Payment Methods</h2>
          <p className="text-muted-foreground text-xs mb-5">Revenue by payment type</p>
          {payBreak.every((p) => p.value === 0) ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No sales data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={payBreak} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {payBreak.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatKES(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {payBreak.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-semibold">{formatKES(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Receipt size={17} className="text-primary" />
          <h2 className="font-bold text-base">Recent Transactions</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/60">
                {['Receipt', 'Shop', 'Date & Time', 'Cashier', 'Items', 'Payment', 'Total'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No transactions yet. Process a sale from the POS terminal.</td></tr>
              ) : recent.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.receiptNo}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-medium">{tx.department === 'Refabit Technologies' ? 'Tech' : 'Signsquare'}</td>
                  <td className="px-4 py-3 text-xs">{new Date(tx.timestamp).toLocaleString('en-KE', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-4 py-3">{tx.cashierName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tx.paymentMode === 'Cash'   ? 'bg-emerald-100 text-emerald-700' :
                      tx.paymentMode === 'M-Pesa' ? 'bg-blue-100 text-blue-700' :
                      tx.paymentMode === 'I&M'    ? 'bg-orange-100 text-orange-700' :
                                                     'bg-purple-100 text-purple-700'
                    }`}>{tx.paymentMode}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{formatKES(tx.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-border">
          {recent.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground text-sm">No transactions yet.</p>
          ) : recent.map((tx) => (
            <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{tx.receiptNo}</p>
                <p className="text-sm font-semibold truncate">{tx.cashierName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.timestamp).toLocaleString('en-KE', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  {' · '}{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-bold text-sm text-primary">{formatKES(tx.total)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tx.paymentMode === 'Cash'   ? 'bg-emerald-100 text-emerald-700' :
                  tx.paymentMode === 'M-Pesa' ? 'bg-blue-100 text-blue-700' :
                  tx.paymentMode === 'I&M'    ? 'bg-orange-100 text-orange-700' :
                                               'bg-purple-100 text-purple-700'
                }`}>{tx.paymentMode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
