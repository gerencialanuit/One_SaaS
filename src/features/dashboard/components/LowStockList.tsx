import Link from 'next/link'
import type { LowStockProduct } from '../types'

export function LowStockList({ products }: { products: LowStockProduct[] }) {
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Alertas de stock bajo</h2>
      {products.length === 0 ? (
        <p className="mt-2 text-sm text-slate">Todo el inventario está por encima de su umbral.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between rounded-md border border-[#E5E9EF] px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-navy">{product.name}</div>
                {product.sku && <div className="text-xs text-slate-muted">{product.sku}</div>}
              </div>
              <span className="inline-flex items-center rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium text-[#8A6D00]">
                Disponibilidad: {product.available} (umbral {product.threshold})
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/products" className="mt-3 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        Ver catálogo completo
      </Link>
    </div>
  )
}
