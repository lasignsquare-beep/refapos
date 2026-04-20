'use client'

import { DownloadIcon, PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  onExport: () => void
  onPrint: () => void
}

export function DashboardHeader({ onExport, onPrint }: DashboardHeaderProps) {
  return (
    <div className="border-b border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden">
            {/* Light mode logo */}
            <img
              src="/light.png"
              alt="Refabit Technologies"
              className="h-full w-full object-contain dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src="/dark.png"
              alt="Refabit Technologies"
              className="h-full w-full object-contain hidden dark:block"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sales Sheet System</h1>
            <p className="text-sm text-muted-foreground">Refabit Technologies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="gap-2"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}
