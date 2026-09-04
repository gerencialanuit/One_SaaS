'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // CRITICO: usar window.location.origin — iOS rechaza el registro si hay un redirect 307.
    const swUrl = `${window.location.origin}/sw.js`

    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .catch((err) => console.error('[PWA] Registration failed:', err))
  }, [])

  return null
}
