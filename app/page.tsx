'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Receipt, User, Tag, Banknote, Smartphone, CreditCard, Building2, CheckCircle, ChevronUp } from 'lucide-react'
import { getProducts, getSession, addTransaction, getNextReceiptNo, updateProduct } from '@/lib/store'
import { formatKES, getCategoryConf, CATEGORIES_TECH, CATEGORIES_SIGN, DEPARTMENTS } from '@/lib/pos-utils'
import type { Product, CartItem, SaleTransaction, PaymentMode, Session } from '@/lib/types'

/* ── Receipt Modal ──────────────────────────────────────────────────────── */
function ReceiptModal({ tx, onClose }: { tx: SaleTransaction; onClose: () => void }) {
  const handlePrint = () => {
    const w = window.open('', '', 'width=400,height=600')
    if (!w) return

    const logoSrc = tx.department === 'The Signsquare' ? '/sign.png' : '/light.png'
    const absoluteLogoUrl = window.location.origin + logoSrc

    w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${tx.receiptNo}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;font-size:12px;padding:16px;width:320px}
    h1{font-size:16px;font-weight:bold;text-align:center;text-transform:uppercase;}.center{text-align:center}.divider{border-top:1px dashed #000;margin:8px 0}
    table{width:100%}td{padding:2px 0}.right{text-align:right}.total{font-size:14px;font-weight:bold}
    .logo-container{display:flex;justify-content:center;margin-bottom:8px;}.logo{max-height:60px;max-width:200px;object-fit:contain;}</style></head>
    <body><div class="logo-container"><img class="logo" src="${absoluteLogoUrl}" alt="${tx.department || 'Logo'}" /></div><p class="center">Point of Sale Receipt</p>
    <div class="divider"></div>
    <p>Receipt: ${tx.receiptNo}</p><p>Date: ${new Date(tx.timestamp).toLocaleString('en-KE')}</p>
    <p>Cashier: ${tx.cashierName}</p>${tx.customer ? `<p>Customer: ${tx.customer}</p>` : ''}
    <div class="divider"></div>
    <table>${tx.items.map(i => `<tr><td>${i.name}${i.description ? `<br><small style="color:#666">${i.description}</small>` : ''}</td><td class="right">${i.quantity}${i.unit === 'm' ? 'm' : ''} x ${formatKES(i.price)}</td></tr><tr><td></td><td class="right">${formatKES(i.subtotal)}</td></tr>`).join('')}</table>
    <div class="divider"></div>
    <table><tr><td>Subtotal</td><td class="right">${formatKES(tx.subtotal)}</td></tr>
    ${tx.discount > 0 ? `<tr><td>Discount</td><td class="right">-${formatKES(tx.discount)}</td></tr>` : ''}
    <tr class="total"><td>TOTAL</td><td class="right">${formatKES(tx.total)}</td></tr>
    <tr><td>Payment</td><td class="right">${tx.paymentMode}</td></tr></table>
    <div class="divider"></div><p class="center">Thank you for your business!</p>
    <script>
      var img = document.querySelector('img.logo');
      if (img) {
        if (img.complete) { window.print(); }
        else { img.onload = function() { window.print(); }; img.onerror = function() { window.print(); }; }
      } else {
        window.print();
      }
    </script>
    </body></html>`)
    w.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-white" size={24} />
            <div>
              <p className="text-white font-bold text-lg">Sale Complete!</p>
              <p className="text-emerald-100 text-sm">{tx.receiptNo}</p>
            </div>
          </div>
          <img 
            src={tx.department === 'The Signsquare' ? '/sign.png' : '/light.png'} 
            alt="Logo" 
            className="h-10 w-auto object-contain bg-white/10 rounded-lg p-1"
          />
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            {tx.items.map((item) => (
              <div key={item.productId} className="flex flex-col mb-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">{item.name} ×{item.quantity}{item.unit === 'm' ? 'm' : ''}</span>
                  <span className="font-medium">{formatKES(item.subtotal)}</span>
                </div>
                {item.description && <span className="text-[10px] text-slate-400">{item.description}</span>}
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
              {tx.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span><span>-{formatKES(tx.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span className="text-emerald-600">{formatKES(tx.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Payment</span><span>{tx.paymentMode}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-sm">
              <Receipt size={15} /> Print Receipt
            </button>
            <button onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm">
              New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Cart Panel ─────────────────────────────────────────────────────────── */
function CartPanel({
  cart, session, subtotal, total, discount, customer, payMode, processing, saleError,
  setCart, setDiscount, setCustomer, setPayMode, changeQty, setQty, removeItem,
  onCharge,
  payModes,
}: {
  cart: CartItem[]
  session: Session | null
  subtotal: number
  total: number
  discount: number
  customer: string
  payMode: PaymentMode
  processing: boolean
  saleError: string | null
  setCart: (c: CartItem[]) => void
  setDiscount: (v: number) => void
  setCustomer: (v: string) => void
  setPayMode: (m: PaymentMode) => void
  changeQty: (id: string, delta: number) => void
  setQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  onCharge: () => void
  payModes: { mode: PaymentMode; icon: React.ReactNode; label: string }[]
}) {
  return (
    <>
      {/* Cart header */}
      <div className="px-4 lg:px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary" />
          <span className="font-bold text-base">Current Sale</span>
        </div>
        {cart.length > 0 && (
          <button onClick={() => setCart([])}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <ShoppingCart size={28} strokeWidth={1.2} className="mb-2 opacity-30" />
            <p className="text-xs">Tap a product to add it</p>
          </div>
        ) : cart.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 bg-background rounded-xl p-3 border border-border">
            <div className={`w-8 h-8 rounded-lg ${getCategoryConf(item.category).bg} flex items-center justify-center text-sm shrink-0`}>
              {getCategoryConf(item.category).emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{item.name}</p>
              {item.description && <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>}
              <p className="text-xs text-primary font-medium">{formatKES(item.subtotal)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => changeQty(item.productId, -1)}
                className="w-9 h-9 rounded-lg bg-slate-100 active:bg-slate-300 hover:bg-slate-200 flex items-center justify-center shrink-0 touch-manipulation">
                <Minus size={13} />
              </button>
              <div className="flex items-center gap-0.5">
                <input type="number" step="any" min="0" inputMode="decimal" value={item.quantity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v)) setQty(item.productId, v)
                  }}
                  className="text-xs font-bold w-14 text-center bg-transparent border border-slate-200 rounded-md focus:outline-none focus:border-red-400 py-1 no-spinners" />
                {item.unit === 'm' && <span className="text-[10px] text-muted-foreground">m</span>}
              </div>
              <button onClick={() => changeQty(item.productId, 1)}
                className="w-9 h-9 rounded-lg bg-slate-100 active:bg-slate-300 hover:bg-slate-200 flex items-center justify-center shrink-0 touch-manipulation">
                <Plus size={13} />
              </button>
              <button onClick={() => removeItem(item.productId)}
                className="w-9 h-9 rounded-lg text-red-400 hover:bg-red-50 active:bg-red-100 flex items-center justify-center ml-0.5 touch-manipulation">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panel */}
      <div className="border-t border-border px-5 py-4 space-y-3 shrink-0">
        {/* Customer */}
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" inputMode="text" placeholder="Customer name (optional)" value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Discount */}
        <div className="relative">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="number" inputMode="numeric" placeholder="Discount (KES)" value={discount || ''}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            min="0" max={subtotal}
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Totals */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatKES(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span><span>-{formatKES(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-1.5">
            <span>Total</span><span className="text-primary">{formatKES(total)}</span>
          </div>
        </div>

        {/* Payment mode */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {payModes.map(({ mode, icon, label }) => (
            <button key={mode} onClick={() => setPayMode(mode)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                payMode === mode
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-background border-border text-muted-foreground hover:border-slate-300'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {saleError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 font-medium">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{saleError}</span>
          </div>
        )}

        {/* Charge button */}
        <button
          onClick={onCharge}
          disabled={cart.length === 0 || processing}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base touch-manipulation"
        >
          {processing
            ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Receipt size={18} />}
          {processing ? 'Processing…' : `Charge ${formatKES(total)}`}
        </button>
      </div>
    </>
  )
}

/* ── POS Terminal ───────────────────────────────────────────────────────── */
export default function POSPage() {
  const [session, setSession]       = useState<Session | null>(null)
  const [products, setProducts]     = useState<Product[]>([])
  const [cart, setCart]             = useState<CartItem[]>([])
  const [search, setSearch]         = useState('')
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0])
  const [category, setCategory]     = useState('All')
  const [payMode, setPayMode]       = useState<PaymentMode>('Cash')
  const [discount, setDiscount]     = useState(0)
  const [customer, setCustomer]     = useState('')
  const [receipt, setReceipt]       = useState<SaleTransaction | null>(null)
  const [processing, setProcessing] = useState(false)
  const [cartOpen, setCartOpen]     = useState(false)  // mobile cart sheet
  const [saleError, setSaleError]   = useState<string | null>(null)

  useEffect(() => {
    setSession(getSession())
    getProducts().then(setProducts)
  }, [])

  /* Filter products */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchDept = p.department === department
      const matchCat  = category === 'All' || p.category === category
      const matchName = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      return matchDept && matchCat && matchName
    })
  }, [products, search, category, department])

  /* Cart helpers */
  const addToCart = (product: Product) => {
    if (product.stock === 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, category: product.category, subcategory: product.subcategory,
        price: product.price, quantity: 1, unit: product.unit || 'pcs', subtotal: product.price, description: product.description }]
    })
  }

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== id) return i
        const qty = i.quantity + delta
        return qty <= 0 ? null : { ...i, quantity: qty, subtotal: qty * i.price }
      }).filter(Boolean) as CartItem[]
    )
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== id) return i
        return qty <= 0 ? null : { ...i, quantity: qty, subtotal: qty * i.price }
      }).filter(Boolean) as CartItem[]
    )
  }

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.productId !== id))

  /* Totals */
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const total    = Math.max(0, subtotal - discount)

  /* Process sale */
  const processSale = async () => {
    if (cart.length === 0 || !session) return
    setProcessing(true)

    const tx: SaleTransaction = {
      id: `tx-${Date.now()}`, items: cart, subtotal, discount, total,
      paymentMode: payMode, customer, cashierName: session.name,
      timestamp: new Date().toISOString(), receiptNo: getNextReceiptNo(),
      department: department
    }

    try {
      await addTransaction(tx)
      const updatedProducts = await getProducts()
      setProducts(updatedProducts)
      setCart([])
      setDiscount(0)
      setCustomer('')
      setSaleError(null)
      setReceipt(tx)
      setCartOpen(false)
    } catch (e: any) {
      console.error(e)
      const msg = e?.message || 'Unknown error'
      setSaleError(`Failed to save sale: ${msg}. Check your connection and try again.`)
      setTimeout(() => setSaleError(null), 8000)
    } finally {
      setProcessing(false)
    }
  }

  const payModes: { mode: PaymentMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'Cash',   icon: <Banknote size={15} />,   label: 'Cash' },
    { mode: 'M-Pesa', icon: <Smartphone size={15} />, label: 'M-Pesa' },
    { mode: 'DTB',    icon: <CreditCard size={15} />, label: 'DTB' },
    { mode: 'I&M',    icon: <Building2 size={15} />,  label: 'I&M' },
  ]

  const cartPanelProps = {
    cart, session, subtotal, total, discount, customer, payMode, processing, saleError,
    setCart, setDiscount, setCustomer, setPayMode,
    changeQty, setQty, removeItem, onCharge: processSale, payModes,
  }

  return (
    <>
      {receipt && <ReceiptModal tx={receipt} onClose={() => setReceipt(null)} />}

      {/* ── Mobile cart sheet overlay ── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
          onClick={() => setCartOpen(false)}
        />
      )}

      <div className="flex flex-col lg:flex-row lg:h-full lg:overflow-hidden overflow-y-auto relative">
        {/* ── Left: Product Grid ── */}
        <div className="flex-1 flex flex-col min-w-0 p-3 lg:p-5 gap-3 lg:gap-4 lg:overflow-y-auto pb-36 md:pb-3 lg:pb-5">
          {/* Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Search products…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {search && (
              <button onClick={() => setSearch('')}
                className="px-3 py-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground text-sm">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Department Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
            {DEPARTMENTS.map(dept => (
              <button key={dept} onClick={() => { setDepartment(dept); setCategory('All') }}
                className={`flex-1 sm:flex-none flex-shrink-0 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  department === dept ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {dept}
              </button>
            ))}
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 lg:mx-0 lg:px-0">
            {['All', ...(department === 'Refabit Technologies' ? CATEGORIES_TECH : CATEGORIES_SIGN)].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 flex-shrink-0 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  category === cat
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-card text-muted-foreground border-border hover:border-slate-300'
                }`}
              >
                {cat !== 'All' ? `${getCategoryConf(cat).emoji} ` : ''}{cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <ShoppingCart size={36} strokeWidth={1.2} className="mb-3 opacity-40" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filtered.map((product) => {
                  const conf       = getCategoryConf(product.category)
                  const inCart     = cart.find((i) => i.productId === product.id)
                  const outOfStock = product.stock === 0
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                      className={`relative flex flex-col rounded-xl border p-3 text-left transition-all group ${
                        outOfStock
                          ? 'opacity-50 cursor-not-allowed border-border bg-card'
                          : inCart
                          ? 'border-red-400 bg-red-50 shadow-sm'
                          : 'border-border bg-card hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center text-xl mb-2`}>
                        {conf.emoji}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-0.5">{product.name}</p>
                      {product.description && <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">{product.description}</p>}
                      <p className="text-xs font-bold text-primary">{formatKES(product.price)}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
                          {product.category}
                        </span>
                        <span className={`text-[10px] font-semibold ${product.stock <= product.lowStockThreshold ? 'text-amber-600' : 'text-slate-400'}`}>
                          {outOfStock ? 'Out' : `${product.stock} left`}
                        </span>
                      </div>
                      {inCart && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {inCart.quantity}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart — desktop sidebar ── */}
        <div className="hidden lg:flex w-80 xl:w-96 border-l border-border bg-card flex-col shrink-0 overflow-y-auto">
          <CartPanel {...cartPanelProps} />
        </div>

        {/* ── Mobile / Tablet: floating cart button + slide-up sheet ── */}
        {/* Floating cart FAB */}
        <button
          onClick={() => setCartOpen(true)}
          className={`lg:hidden fixed right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
            cart.length > 0
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-white/70'
          }`}
          style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
        >
          <ShoppingCart size={18} />
          <span>{cart.length > 0 ? `${cart.length} item${cart.length !== 1 ? 's' : ''} · ${formatKES(total)}` : 'Cart'}</span>
          {cart.length > 0 && <ChevronUp size={16} />}
        </button>

        {/* Slide-up cart sheet on mobile/tablet */}
        <div
          className={`lg:hidden fixed inset-x-0 z-40 bg-card border-t border-border rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            cartOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            bottom: 'calc(60px + env(safe-area-inset-bottom))',
            maxHeight: 'calc(85dvh - 60px - env(safe-area-inset-bottom))',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2 shrink-0" onClick={() => setCartOpen(false)}>
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>
          <CartPanel {...cartPanelProps} />
        </div>
      </div>
    </>
  )
}
