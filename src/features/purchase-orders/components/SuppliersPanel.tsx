'use client'

import { useState } from 'react'
import { SupplierFormModal } from './SupplierFormModal'
import type { Supplier } from '@/types/database'

interface SuppliersPanelProps {
  suppliers: Supplier[]
  canManage: boolean
}

export function SuppliersPanel({ suppliers, canManage }: SuppliersPanelProps) {
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null)

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-navy">Proveedores</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setEditingSupplier('new')}
            className="text-sm font-medium text-brand-blue hover:text-brand-blue-hover"
          >
            + Nuevo proveedor
          </button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <p className="mt-3 text-sm text-slate">No hay proveedores todavía.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#E5E9EF]">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-navy">{supplier.name}</div>
                {supplier.contact_name && <div className="text-slate-muted">{supplier.contact_name}</div>}
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setEditingSupplier(supplier)}
                  className="font-medium text-brand-blue hover:text-brand-blue-hover"
                >
                  Editar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editingSupplier && (
        <SupplierFormModal
          supplier={editingSupplier === 'new' ? null : editingSupplier}
          onClose={() => setEditingSupplier(null)}
        />
      )}
    </div>
  )
}
