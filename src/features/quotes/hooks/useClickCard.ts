'use client'

import { useEffect, useRef, useState } from 'react'

interface CardPos {
  top: number
  left: number
}

export function useClickCard(width: number) {
  const [pos, setPos] = useState<CardPos | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  function close() {
    setPos(null)
  }

  function toggle(rect: DOMRect) {
    setPos((prev) => {
      if (prev) return null
      const centerX = rect.left + rect.width / 2
      const left = Math.min(Math.max(centerX - width / 2, 8), window.innerWidth - width - 8)
      const top = Math.min(Math.max(rect.top, 8), window.innerHeight - 380)
      return { top, left }
    })
  }

  useEffect(() => {
    if (!pos) return

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popupRef.current?.contains(target)) return
      close()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [pos])

  return { pos, toggle, close, triggerRef, popupRef }
}
