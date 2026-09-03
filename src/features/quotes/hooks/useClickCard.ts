'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface CardPos {
  top: number
  left: number
}

const MARGIN = 8

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
      const left = Math.min(Math.max(centerX - width / 2, MARGIN), window.innerWidth - width - MARGIN)
      const top = Math.min(Math.max(rect.top, MARGIN), window.innerHeight - MARGIN)
      return { top, left }
    })
  }

  // Once the popup has its real size, re-clamp it fully inside the viewport
  // instead of relying on a guessed height up front.
  useLayoutEffect(() => {
    if (!pos || !popupRef.current) return
    const rect = popupRef.current.getBoundingClientRect()

    let nextTop = pos.top
    let nextLeft = pos.left

    if (rect.bottom > window.innerHeight - MARGIN) {
      nextTop = Math.max(MARGIN, window.innerHeight - MARGIN - rect.height)
    }
    if (rect.right > window.innerWidth - MARGIN) {
      nextLeft = Math.max(MARGIN, window.innerWidth - MARGIN - rect.width)
    }

    if (nextTop !== pos.top || nextLeft !== pos.left) {
      setPos({ top: nextTop, left: nextLeft })
    }
  }, [pos])

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
