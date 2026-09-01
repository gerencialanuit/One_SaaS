'use client'

import { useMemo, useState } from 'react'
import { toggleFavoriteProduct } from '@/actions/favorites'
import { ProductCard } from './ProductCard'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteProductOption } from '../types'

interface ProductCatalogGridProps {
  products: QuoteProductOption[]
  cartTotals: Map<string, number>
  onAdd: (productId: string) => void
}

export function ProductCatalogGrid({ products, cartTotals, onAdd }: ProductCatalogGridProps) {
  const { t } = useLocale()
  const [category, setCategory] = useState('Todas')
  const [brand, setBrand] = useState('Todas')
  const [search, setSearch] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyUsed, setOnlyUsed] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(products.filter((p) => p.is_favorite).map((p) => p.id))
  )

  function toggleFavorite(productId: string) {
    const wasFavorite = favoriteIds.has(productId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (wasFavorite) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
    toggleFavoriteProduct(productId, !wasFavorite).then((result) => {
      if (result?.error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (wasFavorite) {
            next.add(productId)
          } else {
            next.delete(productId)
          }
          return next
        })
      }
    })
  }

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category))].sort()
    return ['Todas', ...unique]
  }, [products])

  const brands = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.brand).filter((b): b is string => !!b))].sort()
    return ['Todas', ...unique]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === 'Todas' || p.category === category
      const matchesBrand = brand === 'Todas' || p.brand === brand
      const matchesFavorite = !onlyFavorites || favoriteIds.has(p.id)
      const matchesUsed = !onlyUsed || p.condition === 'usado'
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesBrand && matchesFavorite && matchesUsed && matchesSearch
    })
  }, [products, category, brand, onlyFavorites, favoriteIds, onlyUsed, search])

  return (
    <div>
      <input
        type="text"
        placeholder={t('quoteBuilder.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-[#E5E9EF] bg-white px-4 py-2.5 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={
              cat === category
                ? 'rounded-full bg-brand-blue-dark px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-[#E5E9EF] bg-white px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
            }
          >
            {cat === 'Todas' ? t('quoteBuilder.categoryAll') : cat}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={
            onlyFavorites
              ? 'flex items-center gap-1.5 rounded-full bg-brand-yellow px-4 py-1.5 text-sm font-medium text-navy'
              : 'flex items-center gap-1.5 rounded-full border border-[#E5E9EF] bg-white px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-yellow hover:text-navy'
          }
        >
          <svg viewBox="0 0 20 20" fill={onlyFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5z" />
          </svg>
          {t('quoteBuilder.favorites')}
        </button>
        <button
          type="button"
          onClick={() => setOnlyUsed((prev) => !prev)}
          className={
            onlyUsed
              ? 'rounded-full bg-navy px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-full border border-[#E5E9EF] bg-white px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
          }
        >
          {t('quoteBuilder.used')}
        </button>
      </div>

      {brands.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-muted">{t('quoteBuilder.brandLabel')}</span>
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              className={
                b === brand
                  ? 'rounded-full bg-navy px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-[#E5E9EF] bg-white px-3 py-1 text-xs font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
              }
            >
              {b === 'Todas' ? t('quoteBuilder.brandAll') : b}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate">{t('quoteBuilder.noProducts')}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantityInCart={cartTotals.get(product.id) ?? 0}
              onAdd={() => onAdd(product.id)}
              isFavorite={favoriteIds.has(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
