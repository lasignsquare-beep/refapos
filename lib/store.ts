import { supabase } from './supabase'
import type { User, Session, Product, SaleTransaction, StockLog, PaymentMode } from './types'

const KEYS = {
  session: 'pos_session',
  products_local: 'pos_products', // Used for data migration once
  receiptCounter: 'pos_receipt_counter',
}

// ── Bootstrap & Migration ───────────────────────────────────────────────────
export async function initStore() {
  if (typeof window === 'undefined') return
  
  // Data Migration Logic (LocalStorage -> Supabase)
  const localProductsData = localStorage.getItem(KEYS.products_local);
  if (localProductsData) {
      try {
          const localProducts = JSON.parse(localProductsData) as Product[];
          if (localProducts && localProducts.length > 0) {
              console.log("Migrating local products to Supabase...");
              
              const productsToInsert = localProducts.map(p => ({
                 // Ignore local 'id', use server generated UUID, keep SKU
                 name: p.name,
                 category: p.category,
                 sku: p.sku,
                 price: p.price,
                 stock: p.stock,
                 low_stock_threshold: p.lowStockThreshold
              }));
              
              const { error } = await supabase.from('pos_products').insert(productsToInsert);
              
              if (error) {
                  console.error("Migration failed:", error);
              } else {
                  console.log("Migration successful.");
                  localStorage.removeItem(KEYS.products_local); // Clear local data on success
              }
          }
      } catch (e) {
          console.error("Error parsing local products for migration", e);
      }
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('pos_users').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching users:', error); return []; }
  
  return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role,
      name: u.name,
      createdAt: u.created_at
  }));
}

export async function addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
  const { data, error } = await supabase.from('pos_users').insert([{
      username: user.username,
      password: user.password,
      role: user.role,
      name: user.name
  }]).select().single()

  if (error) { console.error('Error adding user:', error); return null; }
  return { id: data.id, username: data.username, password: data.password, role: data.role, name: data.name, createdAt: data.created_at }
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) {
  const { error } = await supabase.from('pos_users').update(updates).eq('id', id);
  if (error) console.error('Error updating user:', error);
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from('pos_users').delete().eq('id', id);
  if (error) console.error('Error deleting user:', error);
}

export async function validateCredentials(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.from('pos_users').select('*').eq('username', username).eq('password', password).single();
  if (error || !data) return null;
  return { id: data.id, username: data.username, password: data.password, role: data.role, name: data.name, createdAt: data.created_at }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.session)
  return raw ? JSON.parse(raw) : null
}

export function setSession(user: User): Session {
  const session: Session = {
    userId: user.id, username: user.username, name: user.name, role: user.role,
    loginTime: new Date().toISOString(),
  }
  localStorage.setItem(KEYS.session, JSON.stringify(session))
  return session
}

export function clearSession() {
  localStorage.removeItem(KEYS.session)
}

// ── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
   const { data, error } = await supabase.from('pos_products').select('*').order('name', { ascending: true });
   if (error) { console.error('Error fetching products:', error); return []; }
   
  return data.map((p: any) => ({
       id: p.id,
       name: p.name,
       category: p.category,
       subcategory: p.subcategory || 'Other',
       sku: p.sku,
       price: p.price,
       stock: p.stock,
       unit: p.unit || 'pcs',
       lowStockThreshold: p.low_stock_threshold,
       department: p.department || 'Refabit Technologies',
       description: p.description,
       createdAt: p.created_at
   }));
}

export async function addProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> {
  const { data: result, error } = await supabase.from('pos_products').insert([{
      name: data.name,
      category: data.category,
      subcategory: data.subcategory || 'Other',
      sku: data.sku,
      price: data.price,
      stock: data.stock,
      unit: data.unit || 'pcs',
      low_stock_threshold: data.lowStockThreshold,
      department: data.department || 'Refabit Technologies',
      description: data.description
  }]).select().single()

  if (error) { console.error('Error adding product:', error); return null; }
  return { id: result.id, name: result.name, category: result.category, subcategory: result.subcategory, sku: result.sku, price: result.price, stock: result.stock, unit: result.unit, lowStockThreshold: result.low_stock_threshold, department: result.department, description: result.description, createdAt: result.created_at }
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<boolean> {
  const mappedUpdates: any = {...updates};
  if (updates.lowStockThreshold !== undefined) {
      mappedUpdates.low_stock_threshold = updates.lowStockThreshold;
      delete mappedUpdates.lowStockThreshold;
  }
  
  const { error } = await supabase.from('pos_products').update(mappedUpdates).eq('id', id);
  if (error) { console.error('Error updating product:', error); return false; }
  return true;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('pos_products').delete().eq('id', id);
  if (error) console.error('Error deleting product:', error);
}

export async function adjustStock(id: string, currentStock: number, delta: number, reason: string, adjustedBy: string): Promise<boolean> {
  const newStock = Math.max(0, currentStock + delta)
  const { error: updateError } = await supabase.from('pos_products').update({ stock: newStock }).eq('id', id);
  
  if (updateError) { console.error('Error adjusting stock:', updateError); return false; }
  
  // Fetch product name for logging
  const { data: pData } = await supabase.from('pos_products').select('name').eq('id', id).single();
  const pName = pData?.name || 'Unknown Product';

  const { error: logError } = await supabase.from('pos_stock_log').insert([{
      product_id: id,
      product_name: pName,
      delta: delta,
      reason: reason,
      adjusted_by: adjustedBy
  }]);

  if (logError) console.error('Error logging stock adjustment:', logError);
  
  return true;
}

// ── Transactions ─────────────────────────────────────────────────────────────
export async function getTransactions(): Promise<SaleTransaction[]> {
   const { data, error } = await supabase
       .from('pos_transactions')
       .select('*, items:pos_transaction_items(*)')
       .order('created_at', { ascending: false });
       
   if (error) { console.error('Error fetching transactions:', error); return []; }
   
   return data.map((t: any) => ({
       id: t.id,
       receiptNo: t.receipt_no,
       subtotal: t.subtotal,
       discount: t.discount,
       total: t.total,
       paymentMode: t.payment_mode,
       customer: t.customer,
       cashierName: t.cashier_name,
       timestamp: t.created_at,
       department: t.department || 'Refabit Technologies',
       items: t.items.map((i: any) => ({
           productId: i.product_id,
           name: i.name,
           category: i.category,
           subcategory: i.subcategory || 'Other',
           price: i.price,
           quantity: i.quantity,
           unit: i.unit || 'pcs',
           subtotal: i.subtotal,
           description: i.description
       }))
   }));
}

export async function addTransaction(txData: Omit<SaleTransaction, 'id' | 'timestamp'>) {
    // 1. Insert transaction
    const { data: txRecord, error: txError } = await supabase.from('pos_transactions').insert([{
        receipt_no: txData.receiptNo,
        subtotal: txData.subtotal,
        discount: txData.discount,
        total: txData.total,
        payment_mode: txData.paymentMode,
        customer: txData.customer,
        cashier_name: txData.cashierName,
        department: txData.department || 'Refabit Technologies'
    }]).select().single()

    if (txError) { console.error('Error adding transaction:', txError); throw txError; }
    
    // 2. Insert items
    const itemsToInsert = txData.items.map(item => ({
        transaction_id: txRecord.id,
        product_id: item.productId,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || 'Other',
        price: item.price,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        subtotal: item.subtotal,
        description: item.description
    }))

    const { error: itemsError } = await supabase.from('pos_transaction_items').insert(itemsToInsert);
    if (itemsError) { console.error('Error adding transaction items:', itemsError); throw itemsError; }
    
    // 3. Deduct stock for each item (in a robust app, use RPC/stored procedures for this)
    // Quick approach for now: iterate and update
    for (const item of txData.items) {
        // We get current stock, but robust apps do this atomically in PG
        const { data: pRow } = await supabase.from('pos_products').select('stock').eq('id', item.productId).single();
        if (pRow) {
            const newStock = Math.max(0, pRow.stock - item.quantity);
            await supabase.from('pos_products').update({stock: newStock}).eq('id', item.productId);
        }
    }
}

export async function deleteTransaction(id: string) {
    // Due to ON DELETE CASCADE on transaction_items, deleting the TX cleans the items
    const { error } = await supabase.from('pos_transactions').delete().eq('id', id);
    if (error) console.error("Error deleting transaction:", error);
}

export function getNextReceiptNo(): string {
  const count = parseInt(localStorage.getItem(KEYS.receiptCounter) ?? '0') + 1
  localStorage.setItem(KEYS.receiptCounter, String(count))
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `RT-${date}-${String(count).padStart(4, '0')}`
}

// ── Stats (calculated locally from fetched TX data for simplicity) ─────────
export function calculateStats(txs: SaleTransaction[]) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayTxs  = txs.filter((t) => t.timestamp.startsWith(today))
  const weekTxs   = txs.filter((t) => new Date(t.timestamp) >= weekStart)
  const monthTxs  = txs.filter((t) => new Date(t.timestamp) >= monthStart)

  return {
    todayTotal:  todayTxs.reduce((s, t) => s + t.total, 0),
    weekTotal:   weekTxs.reduce((s, t) => s + t.total, 0),
    monthTotal:  monthTxs.reduce((s, t) => s + t.total, 0),
    allTimeTotal:txs.reduce((s, t) => s + t.total, 0),
    count:       txs.length,
    todayCount:  todayTxs.length,
    weekCount:   weekTxs.length,
    monthCount:  monthTxs.length,
  }
}

export function calculateDailyRevenue(txs: SaleTransaction[], days = 30): { date: string; revenue: number; count: number }[] {
  const result: Record<string, { revenue: number; count: number }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    result[d.toISOString().split('T')[0]] = { revenue: 0, count: 0 }
  }
  txs.forEach((t) => {
    const day = t.timestamp.split('T')[0]
    if (day in result) { result[day].revenue += Number(t.total); result[day].count++ }
  })
  return Object.entries(result).map(([date, v]) => ({ date, ...v }))
}

export function calculateTopProducts(txs: SaleTransaction[], limit = 6): { name: string; revenue: number; quantity: number }[] {
  const map: Record<string, { name: string; revenue: number; quantity: number }> = {}
  txs.forEach((t) => t.items.forEach((item) => {
    if (!map[item.productId]) map[item.productId] = { name: item.name, revenue: 0, quantity: 0 }
    map[item.productId].revenue   += Number(item.subtotal)
    map[item.productId].quantity  += item.quantity
  }))
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export function calculatePaymentBreakdown(txs: SaleTransaction[]): { name: PaymentMode; value: number }[] {
  const map: Record<string, number> = { Cash: 0, 'M-Pesa': 0, DTB: 0 }
  txs.forEach((t) => { map[t.paymentMode] = (map[t.paymentMode] ?? 0) + Number(t.total) })
  return (Object.entries(map) as [PaymentMode, number][]).map(([name, value]) => ({ name, value }))
}

export function convertToCSV(txs: SaleTransaction[]): string {
  const headers = ['Receipt No','Department','Date','Customer','Cashier','Items','Subtotal','Discount','Total','Payment']
  const rows = txs.map((t) => [
    t.receiptNo,
    t.department,
    new Date(t.timestamp).toLocaleString('en-KE'),
    t.customer || '—',
    t.cashierName,
    t.items.map((i) => `${i.name}${i.description ? ` (${i.description})` : ''} x${i.quantity}${i.unit === 'm' ? 'm' : ''}`).join(' | '),
    t.subtotal, t.discount, t.total, t.paymentMode,
  ])
  return [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
}
