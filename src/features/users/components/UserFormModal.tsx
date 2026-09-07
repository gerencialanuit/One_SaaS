'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions/profiles'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { USER_ROLES, getRoleLabel } from '../constants'
import type { UserRow } from '../types'

interface UserFormModalProps {
  user: UserRow
  isSelf: boolean
  onClose: () => void
}

export function UserFormModal({ user, isSelf, onClose }: UserFormModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { t, locale } = useLocale()
  const router = useRouter()

  useEscapeClose(onClose)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await updateProfile(user.id, formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('users.form.title')}</h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-navy">{t('users.form.name')}</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={user.full_name ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-navy">{t('users.form.cargo')}</label>
            <input
              id="cargo"
              name="cargo"
              type="text"
              defaultValue={user.cargo ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-navy">{t('users.form.username')}</label>
            <input
              id="username"
              type="text"
              disabled
              value={user.email}
              className="mt-1 w-full cursor-not-allowed rounded-md border border-[#E5E9EF] bg-[#F7F9FC] px-3 py-2 text-slate-muted"
            />
            <p className="mt-1 text-xs text-slate-muted">{t('users.form.usernameHint')}</p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-navy">{t('users.form.role')}</label>
            {isSelf ? (
              <>
                <input
                  id="role"
                  type="text"
                  disabled
                  value={getRoleLabel(locale, user.role)}
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-[#E5E9EF] bg-[#F7F9FC] px-3 py-2 text-slate-muted"
                />
                <p className="mt-1 text-xs text-slate-muted">{t('users.form.roleSelfHint')}</p>
              </>
            ) : (
              <select
                id="role"
                name="role"
                defaultValue={user.role}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{getRoleLabel(locale, role)}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="commercial_email" className="block text-sm font-medium text-navy">{t('users.form.commercialEmail')}</label>
            <input
              id="commercial_email"
              name="commercial_email"
              type="email"
              defaultValue={user.commercial_email ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
              {t('users.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {loading ? t('users.form.saving') : t('users.form.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
