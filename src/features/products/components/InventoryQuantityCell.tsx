'use client'

import { useState } from 'react'
import { updateInventoryQuantity } from '@/actions/inventory'

interface InventoryQuantityCellProps {
  productId: string
  quantityOnHand: number
  canEdit: boolean
}

export function InventoryQuantityCell({ productId, quantityOnHand, canEdit }: InventoryQuantityCellProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(quantityOnHand.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canEdit) {
    return <span className="text-navy">{quantityOnHand}</span>
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded px-2 py-1 text-navy hover:bg-tint-blue"
      >
        {quantityOnHand}
      </button>
    )
  }

  async function handleSave(formData: FormData) {
    setSaving(true)
    setError(null)
    const result = await updateInventoryQuantity(productId, formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    setSaving(false)
    setEditing(false)
  }

  return (
    <form action={handleSave} className="flex items-center gap-1">
      <input
        name="quantity_on_hand"
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="w-20 rounded-md border border-[#E5E9EF] bg-white px-2 py-1 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-brand-blue px-2 py-1 text-xs font-medium text-white hover:bg-brand-blue-hover disabled:opacity-50"
      >
        {saving ? '...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false)
          setValue(quantityOnHand.toString())
          setError(null)
        }}
        className="rounded-md px-2 py-1 text-xs text-slate hover:text-navy"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  )
}
