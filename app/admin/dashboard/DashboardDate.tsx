'use client'

import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

export default function DashboardDate() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Calendar className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Calendar className="w-4 h-4" />
      <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
    </div>
  )
}
