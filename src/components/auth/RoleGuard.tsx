import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type AppRole = Database['public']['Enums']['app_role']

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: AppRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { roles, isAdmin } = useAuth()

  // Admin/director always has access
  if (isAdmin) return <>{children}</>

  // Check if user has any of the allowed roles
  const hasAccess = roles.some(r => allowedRoles.includes(r))

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-600">Acceso restringido</p>
          <p className="text-sm text-slate-400 mt-1">No tienes permisos para ver esta sección.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
