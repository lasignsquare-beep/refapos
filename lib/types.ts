export type Role = 'admin' | 'cashier'
export type PaymentMode = 'Cash' | 'M-Pesa' | 'DTB' | 'I&M'

export interface User {
  id: string
  username: string
  password: string
  role: Role
  name: string
  createdAt: string
}

export interface Session {
  userId: string
  username: string
  name: string
  role: Role
  loginTime: string
}

export interface Product {
  id: string
  name: string
  category: string
  subcategory?: string
  sku: string
  price: number
  stock: number
  unit?: string
  lowStockThreshold: number
  department: string
  description?: string
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  category: string
  subcategory?: string
  price: number
  quantity: number
  unit?: string
  subtotal: number
  description?: string
}

export interface SaleTransaction {
  id: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  paymentMode: PaymentMode
  customer: string
  cashierName: string
  timestamp: string
  receiptNo: string
  department: string
}

export interface StockLog {
  id: string
  productId: string
  productName: string
  delta: number
  reason: string
  adjustedBy: string
  timestamp: string
}
