'use client'

import { useState } from 'react'
import { UsersTable } from './UsersTable'
import { UserFormModal } from './UserFormModal'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { UserRow } from '../types'

interface UsersPageClientProps {
  users: UserRow[]
  currentUserId: string
}

export function UsersPageClient({ users, currentUserId }: UsersPageClientProps) {
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const { t } = useLocale()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-navy">{t('users.title')}</h1>
        <p className="mt-1 text-slate">{t('users.subtitle')}</p>
      </div>

      <div className="mt-6">
        <UsersTable users={users} onEdit={(user) => setEditingUser(user)} />
      </div>

      {editingUser && (
        <UserFormModal
          user={editingUser}
          isSelf={editingUser.id === currentUserId}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}
