'use client'

import { useState, useEffect } from 'react'
import { TrashIcon, EditIcon, AlertTriangleIcon, LockIcon } from 'lucide-react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SaleEntry } from './sales-form'

interface SalesTableProps {
  sales: SaleEntry[]
  onDelete: (id: string) => void
  onEdit: (entry: SaleEntry) => void
}

const getToday = () => new Date().toISOString().split('T')[0]

export function SalesTable({ sales, onDelete, onEdit }: SalesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [today, setToday] = useState(getToday)

  // Refresh "today" at midnight so locks apply without a page reload
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      return midnight.getTime() - now.getTime()
    }

    let timeout: ReturnType<typeof setTimeout>
    const scheduleRefresh = () => {
      timeout = setTimeout(() => {
        setToday(getToday())
        scheduleRefresh() // reschedule for the next midnight
      }, msUntilMidnight())
    }
    scheduleRefresh()
    return () => clearTimeout(timeout)
  }, [])

  const isLocked = (saleDate: string) => saleDate !== today

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.date.includes(searchTerm)

    const matchesFilter = filterPayment === 'all' || sale.paymentMode === filterPayment

    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const paymentBadgeColor = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return 'bg-green-100 text-green-800'
      case 'M-Pesa':
        return 'bg-blue-100 text-blue-800'
      case 'DTB':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-muted text-foreground'
    }
  }

  return (
    <Card className="border border-border shadow-sm m-6">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>
              Total entries: {filteredSales.length} of {sales.length}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by client, product, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="sm:w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Modes</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="DTB">DTB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Account</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Remarks</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📋</span>
                        <span>No sales records found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr
                        key={sale.id}
                        className={`border-b border-border transition-colors ${confirmDeleteId === sale.id
                          ? 'bg-red-50'
                          : isLocked(sale.date)
                            ? 'bg-muted/30 opacity-80'
                            : 'hover:bg-muted/50'
                          }`}
                      >
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {formatDate(sale.date)}
                        </td>
                        <td className="px-4 py-3 text-foreground">{sale.account}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{sale.client}</td>
                        <td className="px-4 py-3 text-foreground text-sm max-w-[200px]">
                          <span title={sale.productDescription}>
                            {sale.productDescription.length > 30
                              ? sale.productDescription.substring(0, 30) + '…'
                              : sale.productDescription}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground text-right">
                          {formatCurrency(sale.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-foreground text-right">{sale.quantity}</td>
                        <td className="px-4 py-3 text-foreground text-right font-semibold">
                          {formatCurrency(sale.totalPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${paymentBadgeColor(sale.paymentMode)}`}
                          >
                            {sale.paymentMode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground text-sm">
                          <span title={sale.remarks || '-'}>
                            {sale.remarks.length > 20
                              ? sale.remarks.substring(0, 20) + '…'
                              : sale.remarks || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isLocked(sale.date) ? (
                            <div
                              className="flex justify-center"
                              title="This record is locked. Only today's sales can be edited."
                            >
                              <LockIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(sale)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <EditIcon className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setConfirmDeleteId(
                                    confirmDeleteId === sale.id ? null : sale.id
                                  )
                                }
                                className="h-8 w-8 p-0"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Inline delete confirmation row */}
                      {confirmDeleteId === sale.id && (
                        <tr key={`${sale.id}-confirm`} className="bg-red-50 border-b border-red-200">
                          <td colSpan={10} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-2 text-sm text-red-700 font-medium">
                                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                                Delete sale for <strong>{sale.client}</strong>? This cannot be
                                undone.
                              </span>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => {
                                    onDelete(sale.id)
                                    setConfirmDeleteId(null)
                                  }}
                                >
                                  Yes, Delete
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
