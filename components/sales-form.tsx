'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react'

export interface SaleEntry {
  id: string
  date: string
  account: string
  client: string
  productDescription: string
  unitPrice: number
  quantity: number
  totalPrice: number
  paymentMode: string
  remarks: string
}

interface SalesFormProps {
  onSubmit: (entry: SaleEntry) => void
  editingEntry?: SaleEntry | null
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error' | 'no-url'

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  account: '',
  client: '',
  productDescription: '',
  unitPrice: 0,
  quantity: 0,
  paymentMode: 'Cash',
  remarks: '',
})

export function SalesForm({ onSubmit, editingEntry }: SalesFormProps) {
  const [formData, setFormData] = useState(emptyForm())
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')

  // Populate form when editing an existing entry
  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date,
        account: editingEntry.account,
        client: editingEntry.client,
        productDescription: editingEntry.productDescription,
        unitPrice: editingEntry.unitPrice,
        quantity: editingEntry.quantity,
        paymentMode: editingEntry.paymentMode,
        remarks: editingEntry.remarks,
      })
    } else {
      setFormData(emptyForm())
    }
  }, [editingEntry])

  const totalPrice = formData.unitPrice * formData.quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const entry: SaleEntry = {
      id: editingEntry?.id ?? Date.now().toString(),
      date: formData.date,
      account: formData.account,
      client: formData.client,
      productDescription: formData.productDescription,
      unitPrice: formData.unitPrice,
      quantity: formData.quantity,
      totalPrice,
      paymentMode: formData.paymentMode,
      remarks: formData.remarks,
    }

    // Save locally first
    onSubmit(entry)

    // Only sync new entries to Google Sheets (not edits, to avoid duplicates)
    if (!editingEntry) {
      if (!SCRIPT_URL) {
        setSubmitStatus('no-url')
        setTimeout(() => setSubmitStatus('idle'), 5000)
      } else {
        setSubmitStatus('loading')
        try {
          await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })
          // no-cors means we can't read the response, but if no error was thrown, it worked
          setSubmitStatus('success')
          setTimeout(() => setSubmitStatus('idle'), 4000)
        } catch {
          setSubmitStatus('error')
          setTimeout(() => setSubmitStatus('idle'), 5000)
        }
      }
    } else {
      setSubmitStatus('idle')
    }

    // Reset form
    setFormData(emptyForm())
  }

  const isLoading = submitStatus === 'loading'

  return (
    <Card className="border border-border shadow-sm m-6">
      <CardHeader>
        <CardTitle>{editingEntry ? 'Edit Sale' : 'Sales Entry'}</CardTitle>
        <CardDescription>
          {editingEntry ? 'Update the existing sale record' : 'Record a new sale transaction'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Input
                id="account"
                type="text"
                placeholder="Account name"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                type="text"
                placeholder="Client name"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Mode</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger id="payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="DTB">DTB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product Description</Label>
            <Textarea
              id="product"
              placeholder='Describe the product or service, e.g. 24" Monitor'
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (KES)</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                step="any"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                }
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total Price (KES)</Label>
              <Input
                id="total"
                type="number"
                value={totalPrice}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Additional notes"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={2}
            />
          </div>

          {/* Status feedback banner */}
          {submitStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                submitStatus === 'loading'
                  ? 'bg-muted text-muted-foreground'
                  : submitStatus === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : submitStatus === 'no-url'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {submitStatus === 'loading' && (
                <LoaderIcon className="h-4 w-4 animate-spin shrink-0" />
              )}
              {submitStatus === 'success' && (
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
              )}
              {(submitStatus === 'error' || submitStatus === 'no-url') && (
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
              )}
              <span>
                {submitStatus === 'loading' && 'Syncing to Google Sheets…'}
                {submitStatus === 'success' && 'Sale saved locally and synced to Google Sheets!'}
                {submitStatus === 'no-url' &&
                  'Sale saved locally. Add your Google Apps Script URL to .env.local to enable Sheets sync.'}
                {submitStatus === 'error' &&
                  'Sale saved locally, but Google Sheets sync failed. Check your Apps Script URL.'}
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : editingEntry ? (
              'Update Sale'
            ) : (
              'Save Sale'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
