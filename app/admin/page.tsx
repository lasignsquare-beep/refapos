'use client'

import { useState, useEffect } from 'react'
import { Users, Package, FileDown, Plus, Pencil, Trash2, X, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { getProducts, adjustStock, getUsers, addUser, updateUser, deleteUser, convertToCSV, getTransactions, deleteTransaction } from '@/lib/store'
import { formatKES, getCategoryConf } from '@/lib/pos-utils'
import type { Product, User, SaleTransaction } from '@/lib/types'

/* ── Stock Adjust Modal ─────────────────────────────────────────────────── */
function StockModal({ product, onClose, onDone, cashier }: { product: Product; onClose: () => void; onDone: () => void; cashier: string }) {
  const [delta, setDelta]   = useState('')
  const [reason, setReason] = useState('')
  const [dir, setDir]       = useState<'add' | 'remove'>('add')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(delta)
    if (!n || n <= 0) return
    await adjustStock(product.id, product.stock, dir === 'add' ? n : -n, reason || 'Manual adjustment', cashier)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Adjust Stock — {product.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['add', 'remove'] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDir(d)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  dir === d
                    ? d === 'add' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                {d === 'add' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                {d === 'add' ? 'Add Stock' : 'Remove'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Units</label>
            <input type="number" step="any" min="0" value={delta} onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 10.5" required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Reason (optional)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Restocked from supplier"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button>
            <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold ${dir === 'add' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── User Form Modal ────────────────────────────────────────────────────── */
function UserModal({ editing, onSave, onClose }: { editing: User | null; onSave: () => void; onClose: () => void }) {
  const isEdit = !!editing
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier' as 'admin' | 'cashier' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) setForm({ name: editing.name, username: editing.username, password: editing.password, role: editing.role })
    else setForm({ name: '', username: '', password: '', role: 'cashier' })
    setError('')
  }, [editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return setError('All fields are required.')
    if (isEdit) await updateUser(editing!.id, form)
    else await addUser(form)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">{isEdit ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {[
            { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'e.g. Jane Doe' },
            { label: 'Username', key: 'username' as const, type: 'text', placeholder: 'e.g. jane' },
            { label: 'Password', key: 'password' as const, type: 'text', placeholder: 'Password' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'cashier'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 rounded-xl border text-sm font-semibold capitalize ${
                    form.role === r
                      ? r === 'admin' ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>{r === 'admin' ? '🛡 Admin' : '🏷 Cashier'}</button>
              ))}
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold">
              {isEdit ? 'Update' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Admin Page ─────────────────────────────────────────────────────────── */
type Tab = 'stock' | 'users' | 'transactions'

export default function AdminPage() {
  const [tab, setTab]           = useState<Tab>('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers]       = useState<User[]>([])
  const [transactions, setTransactions] = useState<SaleTransaction[]>([])
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userModal, setUserModal]     = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteTxId, setDeleteTxId]     = useState<string | null>(null)

  const reloadAll = async () => {
    const [p, u, t] = await Promise.all([getProducts(), getUsers(), getTransactions()])
    setProducts(p)
    setUsers(u)
    setTransactions(t)
  }
  useEffect(() => { reloadAll() }, [])

  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold)

  const handleExport = () => {
    const csv  = convertToCSV(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `refabit-sales-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'stock',        label: 'Stock',        icon: Package },
    { id: 'users',        label: 'Users',        icon: Users },
    { id: 'transactions', label: 'Transactions', icon: FileDown },
  ]

  return (
    <>
      {adjusting && (
        <StockModal product={adjusting} cashier="Admin" onClose={() => setAdjusting(null)}
          onDone={() => { setAdjusting(null); reloadAll() }} />
      )}
      {userModal && (
        <UserModal editing={editingUser} onClose={() => { setUserModal(false); setEditingUser(null) }}
          onSave={() => { setUserModal(false); setEditingUser(null); reloadAll() }} />
      )}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs">
            <p className="font-bold text-center mb-4">Delete this user?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUserId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button>
              <button onClick={async () => { await deleteUser(deleteUserId); setDeleteUserId(null); reloadAll() }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
      {deleteTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs">
            <p className="font-bold text-center mb-4">Delete this transaction?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTxId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button>
              <button onClick={async () => { await deleteTransaction(deleteTxId); setDeleteTxId(null); reloadAll() }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage stock, users, and export data</p>
          </div>
          {tab === 'transactions' && (
            <button onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto">
              <FileDown size={15} /> Export CSV
            </button>
          )}
          {tab === 'users' && (
            <button onClick={() => { setEditingUser(null); setUserModal(true) }}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto">
              <Plus size={15} /> Add User
            </button>
          )}
        </div>

        {/* Low-stock alert banner */}
        {lowStockProducts.length > 0 && tab === 'stock' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start sm:items-center gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5 sm:mt-0" size={20} />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
              </p>
              <p className="text-amber-600 text-xs">
                {lowStockProducts.map((p) => `${p.name} (${p.stock} left)`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                tab === id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── Stock Management ── */}
        {tab === 'stock' && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/60">
                      {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Alert At', 'Actions'].map((h) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Price' || h === 'Stock' || h === 'Alert At' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No products yet. Add products first.</td></tr>
                    ) : products.map((p) => {
                      const conf = getCategoryConf(p.category)
                      const low  = p.stock <= p.lowStockThreshold
                      return (
                        <tr key={p.id} className="border-b border-border/60 hover:bg-slate-50/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg ${conf.bg} flex items-center justify-center text-sm`}>{conf.emoji}</div>
                              <div>
                                <span className="font-semibold text-sm block">{p.name}</span>
                                <span className="text-[10px] text-muted-foreground">{p.department === 'Refabit Technologies' ? 'Tech' : 'Signsquare'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${conf.bg} ${conf.text} ${conf.border}`}>{p.category}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{formatKES(p.price)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : low ? 'text-amber-600' : 'text-emerald-600'}`}>{p.stock}</span>
                            {low && <AlertTriangle size={12} className="inline ml-1 text-amber-500" />}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{p.lowStockThreshold}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button onClick={() => setAdjusting(p)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold">Adjust</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {products.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">No products yet.</p>
              ) : products.map((p) => {
                const conf = getCategoryConf(p.category)
                const low  = p.stock <= p.lowStockThreshold
                return (
                  <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${conf.bg} flex items-center justify-center text-xl shrink-0`}>{conf.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>{p.category}</span>
                        <span className="text-xs font-bold text-primary">{formatKES(p.price)}</span>
                        <span className={`text-xs font-bold flex items-center gap-1 ${p.stock === 0 ? 'text-red-600' : low ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {low && <AlertTriangle size={11} />}
                          {p.stock} {p.unit === 'm' ? 'm' : 'pcs'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setAdjusting(p)} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold shrink-0">
                      Adjust
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── User Management ── */}
        {tab === 'users' && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/60">
                    {['User', 'Username', 'Role', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 hover:bg-slate-50/40 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">@{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>{u.role === 'admin' ? '🛡 Admin' : '🏷 Cashier'}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => { setEditingUser(u); setUserModal(true) }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteUserId(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {users.map((u) => (
                <div key={u.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{u.role === 'admin' ? '🛡 Admin' : '🏷 Cashier'}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-KE')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditingUser(u); setUserModal(true) }} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteUserId(u.id)} className="p-2 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Transactions ── */}
        {tab === 'transactions' && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/60">
                      {['Receipt', 'Shop', 'Date & Time', 'Customer', 'Cashier', 'Payment', 'Total', ''].map((h) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No transactions recorded yet.</td></tr>
                    ) : transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/60 hover:bg-slate-50/40 group">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.receiptNo}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">{tx.department === 'Refabit Technologies' ? 'Tech' : 'Sign'}</td>
                        <td className="px-4 py-3 text-xs">{new Date(tx.timestamp).toLocaleString('en-KE')}</td>
                        <td className="px-4 py-3 text-muted-foreground">{tx.customer || '—'}</td>
                        <td className="px-4 py-3">{tx.cashierName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                            tx.paymentMode === 'M-Pesa' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>{tx.paymentMode}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{formatKES(tx.total)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDeleteTxId(tx.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-3">
              {transactions.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">No transactions recorded yet.</p>
              ) : transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{tx.receiptNo}</p>
                      <p className="font-semibold text-sm">{tx.cashierName}</p>
                      {tx.customer && <p className="text-xs text-muted-foreground">{tx.customer}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-bold text-sm text-primary">{formatKES(tx.total)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                        tx.paymentMode === 'M-Pesa' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>{tx.paymentMode}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString('en-KE', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      {' · '}{tx.department === 'Refabit Technologies' ? 'Tech' : 'Sign'}
                      {' · '}{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}
                    </p>
                    <button onClick={() => setDeleteTxId(tx.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
