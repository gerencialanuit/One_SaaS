'use client'

import { getRoleLabel } from '../constants'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { UserRow } from '../types'

interface UsersTableProps {
  users: UserRow[]
  onEdit: (user: UserRow) => void
}

export function UsersTable({ users, onEdit }: UsersTableProps) {
  const { t, locale } = useLocale()

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        {t('users.table.empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">{t('users.table.name')}</th>
            <th className="px-4 py-3 font-medium">{t('users.table.cargo')}</th>
            <th className="px-4 py-3 font-medium">{t('users.table.username')}</th>
            <th className="px-4 py-3 font-medium">{t('users.table.commercialEmail')}</th>
            <th className="px-4 py-3 font-medium">{t('users.table.role')}</th>
            <th className="px-4 py-3 font-medium">{t('users.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
              <td className="px-4 py-3 font-medium text-navy">{user.full_name || '—'}</td>
              <td className="px-4 py-3 text-slate">{user.cargo ?? '—'}</td>
              <td className="px-4 py-3 text-slate">{user.email}</td>
              <td className="px-4 py-3 text-slate">{user.commercial_email ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-tint-blue px-2.5 py-0.5 text-xs font-medium text-navy">
                  {getRoleLabel(locale, user.role)}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="font-medium text-brand-blue hover:text-brand-blue-hover"
                >
                  {t('users.table.edit')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
