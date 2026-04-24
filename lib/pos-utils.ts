export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const DEPARTMENTS = ['Refabit Technologies', 'The Signsquare'] as const
export type Department = (typeof DEPARTMENTS)[number]

export const CATEGORY_TREE = {
  'Refabit Technologies': {
    'Hardware': ['Laptops', 'Desktops', 'Monitors', 'Printers', 'Accessories', 'Keyboards', 'RAM', 'Harddisks', 'Other'],
    'Networking': ['Routers', 'Switches', 'Cables', 'CCTV', 'Other'],
    'Storage': ['SSDs', 'HDDs', 'Flash Drives', 'Other'],
    'Software': ['OS Installations', 'Antivirus', 'Office Packages', 'Custom Systems', 'Other'],
    'Services': ['Repairs', 'Installation', 'Networking Setup', 'CCTV Installation', 'Other'],
    'Furniture': ['Office Chair', 'Office Desk', 'Other'],
    'Other': ['Other']
  },
  'The Signsquare': {
    'Printing Materials': ['Glossy Stickers', 'Matte Stickers', 'Banners', 'White Vinyl', 'Black Vinyl', 'Gold Vinyl', 'Sublimation Items', 'Other'],
    'Mugs': ['Normal Mugs', 'Magic Mugs', 'Two Tone Mugs', 'Sublimation Mugs', 'Sublimation Bottles', 'Other'],
    'Services': ['Design', 'Printing', 'Branding', 'Other'],
    'Other': ['Other']
  }
} as const;

export const CATEGORIES_TECH = Object.keys(CATEGORY_TREE['Refabit Technologies'])
export const CATEGORIES_SIGN = Object.keys(CATEGORY_TREE['The Signsquare'])

export const CATEGORIES = Array.from(new Set([...CATEGORIES_TECH, ...CATEGORIES_SIGN]))
export type Category = string

export const categoryConfig: Record<
  string,
  { color: string; bg: string; text: string; border: string; emoji: string }
> = {
  // Tech
  Hardware:           { color: '#64748b', bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   emoji: '⚙️' },
  Networking:         { color: '#6366f1', bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200',  emoji: '🌐' },
  Storage:            { color: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   emoji: '💽' },
  Software:           { color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', emoji: '📀' },
  Services:           { color: '#d946ef', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', emoji: '🔧' },
  Furniture:          { color: '#8b4513', bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  emoji: '🪑' },
  
  // Graphics
  'Printing Materials':{ color: '#8b5cf6', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200',  emoji: '🖨️' },
  Mugs:               { color: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   emoji: '☕' },

  Other:              { color: '#6b7280', bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-200',    emoji: '📦' },
}

export function getCategoryConf(category: string) {
  return categoryConfig[category] ?? categoryConfig['Other']
}

export function generateSKU(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRD'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}
