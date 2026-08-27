import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'
import type { LowStockProduct } from '../types'

export async function LowStockList({ products }: { products: LowStockProduct[] }) {
  const { t } = await getTranslator()
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('dashboard.lowStock.title')}</h2>
      {products.length === 0 ? (
        <p className="mt-2 text-sm text-slate">{t('dashboard.lowStock.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between rounded-md border border-[#E5E9EF] px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-navy">{product.name}</div>
                {product.sku && <div className="text-xs text-slate-muted">{product.sku}</div>}
              </div>
              <span className="inline-flex items-center rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium text-[#8A6D00]">
                {t('dashboard.lowStock.availability')}: {product.available} ({t('dashboard.lowStock.threshold')} {product.threshold})
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/products" className="mt-3 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        {t('dashboard.lowStock.viewCatalog')}
      </Link>
    </div>
  )
}
