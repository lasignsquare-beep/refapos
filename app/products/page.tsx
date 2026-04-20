'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, X, Package, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/lib/store'
import { formatKES, CATEGORIES, getCategoryConf, generateSKU, DEPARTMENTS, CATEGORY_TREE } from '@/lib/pos-utils'
import type { Product } from '@/lib/types'

/* ── Product Form Sheet ─────────────────────────────────────────────────── */
function ProductSheet({
  editing, onSave, onClose,
}: { editing: Product | null; onSave: () => void; onClose: () => void }) {
  const isEdit = !!editing
  const [form, setForm] = useState({
    name: '', category: '', subcategory: '', sku: '', price: '', stock: '', lowStockThreshold: '5',
    department: DEPARTMENTS[0] as string, description: '', unit: 'pcs'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, sku: editing.sku,
        price: String(editing.price), stock: String(editing.stock),
        lowStockThreshold: String(editing.lowStockThreshold),
        department: editing.department || DEPARTMENTS[0],
        category: editing.category,
        subcategory: editing.subcategory || 'Other',
        description: editing.description || '',
        unit: editing.unit || 'pcs'
      })
    } else {
      const initDept = DEPARTMENTS[0]
      const initCat  = Object.keys(CATEGORY_TREE[initDept])[0]
      const initSub  = (CATEGORY_TREE[initDept] as any)[initCat]?.[0] || 'Other'
      setForm({ name: '', category: initCat, subcategory: initSub, sku: '', price: '', stock: '', lowStockThreshold: '5', department: initDept, description: '', unit: 'pcs' })
    }
    setError('')
  }, [editing])

  const handleNameBlur = () => {
    if (!form.sku && form.name) setForm((f) => ({ ...f, sku: generateSKU(f.name) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const price = parseFloat(form.price)
    const stock = parseFloat(form.stock)
    const threshold = parseFloat(form.lowStockThreshold)
    if (!form.name.trim())  return setError('Product name is required.')
    if (isNaN(price) || price < 0) return setError('Enter a valid price.')
    if (isNaN(stock) || stock < 0) return setError('Enter a valid stock quantity.')
    setSaving(true)
    await new Promise((r) => setTimeout(r, 250))
    const data = { name: form.name.trim(), category: form.category, subcategory: form.subcategory, sku: form.sku || generateSKU(form.name),
      price, stock, lowStockThreshold: isNaN(threshold) ? 5 : threshold, department: form.department, description: form.description.trim(), unit: form.unit }
    if (isEdit) await updateProduct(editing!.id, data)
    else await addProduct(data)
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-muted-foreground text-sm">{isEdit ? 'Update product details' : 'Add a product to the database'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={handleNameBlur} placeholder="e.g. HP LaserJet Printer"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 mb-3" />
            
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Serial Number / Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. SN: 123456789 or Extra product details (optional)" rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none" />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Department</label>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button key={dept} type="button" onClick={() => {
                  const initCat = Object.keys(CATEGORY_TREE[dept])[0]
                  const initSub = (CATEGORY_TREE[dept] as any)[initCat]?.[0] || 'Other'
                  setForm({ ...form, department: dept, category: initCat, subcategory: initSub })
                }}
                  className={`py-2 rounded-xl border text-sm font-semibold transition-all ${
                    form.department === dept ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(CATEGORY_TREE[form.department as keyof typeof CATEGORY_TREE]).map((cat) => {
                const conf = getCategoryConf(cat)
                const active = form.category === cat
                return (
                  <button key={cat} type="button" onClick={() => {
                    const initSub = (CATEGORY_TREE[form.department as keyof typeof CATEGORY_TREE] as any)[cat]?.[0] || 'Other'
                    setForm({ ...form, category: cat, subcategory: initSub })
                  }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      active ? `${conf.bg} ${conf.text} ${conf.border} border-2` : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    <span>{conf.emoji}</span> {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Subcategory</label>
            <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400">
              {((CATEGORY_TREE[form.department as keyof typeof CATEGORY_TREE] as any)[form.category] || ['Other']).map((sub: string) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="Auto-generated from name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Price (KES) *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Stock / Quantity *</label>
              <input type="number" min="0" step="any" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sales Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Sales Unit</label>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button type="button" onClick={() => setForm({...form, unit: 'pcs'})}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${form.unit === 'pcs' ? 'bg-white shadow-sm text-foreground' : 'text-slate-500 hover:text-slate-700'}`}>Pieces</button>
                <button type="button" onClick={() => setForm({...form, unit: 'm'})}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${form.unit === 'm' ? 'bg-white shadow-sm text-foreground' : 'text-slate-500 hover:text-slate-700'}`}>Metres</button>
              </div>
            </div>
            {/* Low stock threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Low Stock Alert</label>
              <input type="number" min="0" step="any" value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="5"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold">
              {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Products Page ──────────────────────────────────────────────────────── */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All')
  const [editing, setEditing]   = useState<Product | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sortBy, setSortBy]     = useState<'name' | 'price' | 'stock'>('name')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')

  const reload = () => getProducts().then(setProducts)
  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = catFilter === 'All' || p.category === catFilter
      const matchDept = deptFilter === 'All' || p.department === deptFilter
      const matchQ   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                       p.sku.toLowerCase().includes(search.toLowerCase()) ||
                       (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchDept && matchQ
    })
    list = list.sort((a, b) => {
      const v = sortBy === 'name' ? a.name.localeCompare(b.name)
              : sortBy === 'price' ? a.price - b.price
              : a.stock - b.stock
      return sortDir === 'asc' ? v : -v
    })
    return list
  }, [products, search, catFilter, deptFilter, sortBy, sortDir])

  const toggleSort = (col: 'name' | 'price' | 'stock') => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('asc') }
  }

  const confirmDelete = async (id: string) => {
    await deleteProduct(id)
    setDeleteId(null)
    reload()
  }

  const SortIcon = ({ col }: { col: 'name' | 'price' | 'stock' }) =>
    sortBy === col
      ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
      : <ChevronUp size={13} className="opacity-20" />

  return (
    <>
      {sheetOpen && (
        <ProductSheet
          editing={editing}
          onSave={() => { setSheetOpen(false); setEditing(null); reload() }}
          onClose={() => { setSheetOpen(false); setEditing(null) }}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="font-bold text-center text-lg mb-1">Delete Product?</h3>
            <p className="text-center text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button>
              <button onClick={() => confirmDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground text-sm">{products.length} products in database</p>
          </div>
          <button onClick={() => { setEditing(null); setSheetOpen(true) }}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold w-full sm:w-auto">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or SKU…"
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-56" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', ...DEPARTMENTS].map((dept) => (
              <button key={dept} onClick={() => setDeptFilter(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                  deptFilter === dept ? 'bg-red-600 text-white border-red-600' : 'bg-card border-border text-muted-foreground hover:border-slate-300'
                }`}>
                {dept === 'All' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                  catFilter === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-card border-border text-muted-foreground hover:border-slate-300'
                }`}>
                {cat !== 'All' ? getCategoryConf(cat).emoji + ' ' : ''}{cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground">
                      Product <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Category & Type</th>
                  <th className="text-right px-4 py-3">
                    <button onClick={() => toggleSort('price')} className="flex items-center gap-1 justify-end font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground ml-auto">
                      Price <SortIcon col="price" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3">
                    <button onClick={() => toggleSort('stock')} className="flex items-center gap-1 justify-end font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground ml-auto">
                      Stock <SortIcon col="stock" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <Package size={32} strokeWidth={1.2} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No products found. Add your first product →</p>
                    </td>
                  </tr>
                ) : filtered.map((p, idx) => {
                  const conf     = getCategoryConf(p.category)
                  const lowStock = p.stock <= p.lowStockThreshold
                  return (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-slate-50/60 group">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${conf.bg} flex items-center justify-center text-base shrink-0`}>{conf.emoji}</div>
                          <span className="font-semibold">{p.name}
                            {p.description && <span className="block text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{p.description}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>{conf.emoji} {p.category}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold px-1">{p.subcategory}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKES(p.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lowStock && <AlertTriangle size={13} className="text-amber-500" />}
                          <span className={`font-semibold ${lowStock ? 'text-amber-600' : ''} ${p.stock === 0 ? 'text-red-600' : ''}`}>{p.stock}</span>
                          <span className="text-muted-foreground text-xs">{p.unit === 'm' ? 'm' : 'pcs'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => { setEditing(p); setSheetOpen(true) }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile Card List ── */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package size={32} strokeWidth={1.2} className="mb-2 opacity-30" />
              <p className="text-sm">No products found. Add your first product.</p>
            </div>
          ) : filtered.map((p) => {
            const conf     = getCategoryConf(p.category)
            const lowStock = p.stock <= p.lowStockThreshold
            return (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${conf.bg} flex items-center justify-center text-xl shrink-0`}>{conf.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  {p.description && <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>{p.category}</span>
                    <span className="text-xs font-bold text-primary">{formatKES(p.price)}</span>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${p.stock === 0 ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-slate-500'}`}>
                      {lowStock && <AlertTriangle size={11} />}
                      {p.stock} {p.unit === 'm' ? 'm' : 'pcs'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => { setEditing(p); setSheetOpen(true) }} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg bg-red-50 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
