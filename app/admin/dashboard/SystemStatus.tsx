'use client'

import { CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

export default function SystemStatus() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              System Status: All Systems Operational
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              All services are running smoothly. Last checked:{' '}
              {mounted ? format(currentTime, 'HH:mm:ss') : '--:--:--'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Online</span>
        </div>
      </div>
    </div>
  )
}
