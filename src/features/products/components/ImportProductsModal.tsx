'use client'

import { useState } from 'react'
import { importProducts, type ImportProductRow, type ImportProductsResult } from '@/actions/products'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { parseCsvRecords } from '../utils/csv'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface ImportProductsModalProps {
  onClose: () => void
}

export function ImportProductsModal({ onClose }: ImportProductsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportProductsResult | null>(null)
  const { t } = useLocale()

  useEscapeClose(onClose)

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const text = await file.text()
    const rows = parseCsvRecords(text) as unknown as ImportProductRow[]
    const response = await importProducts(rows)

    if ('error' in response) {
      setError(response.error)
    } else {
      setResult(response)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('products.import.title')}</h2>
        <p className="mt-2 text-sm text-slate">{t('products.import.instructions')}</p>

        <div className="mt-4">
          <label htmlFor="csv_file" className="block text-sm font-medium text-navy">{t('products.import.selectFile')}</label>
          <input
            id="csv_file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate file:mr-3 file:rounded-md file:border-0 file:bg-tint-blue file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-blue hover:file:bg-brand-blue/10"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-4 rounded-md border border-[#E5E9EF] bg-tint-blue/40 p-3 text-sm text-navy">
            <p>{t('products.import.resultSummary', { created: result.created, updated: result.updated, failed: result.failed })}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-red-600">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
            {t('products.import.close')}
          </button>
          <button
            type="button"
            disabled={!file || loading}
            onClick={handleImport}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
          >
            {loading ? t('products.import.processing') : t('products.import.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
