'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export interface SignaturePadHandle {
  toDataURL: () => string | null
  clear: () => void
  isEmpty: () => boolean
}

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (!hasDrawn || !canvasRef.current) return null
      return canvasRef.current.toDataURL('image/png')
    },
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setHasDrawn(false)
    },
    isEmpty: () => !hasDrawn,
  }))

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const { x, y } = getPoint(e)
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPoint(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#001B40'
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  function handlePointerUp() {
    drawingRef.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={160}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-full touch-none rounded-md border border-[#E5E9EF] bg-white"
    />
  )
})
