import { type ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type AppRole = Database['public']['Enums']['app_role']

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: AppRole[]
  fallback?: ReactNode
  redirectOnDeny?: boolean
}

export function RoleGuard({ children, allowedRoles, fallback, redirectOnDeny = true }: RoleGuardProps) {
  const { roles, isAdmin } = useAuth()
  const setView = useStore(s => s.setView)
  const { toast } = useToast()

  const hasAccess = isAdmin || roles.some(r => allowedRoles.includes(r))

  useEffect(() => {
    if (!hasAccess && redirectOnDeny) {
      toast({
        title: 'Acceso no autorizado',
        description: 'No tienes permisos para acceder a esta sección.',
        variant: 'destructive',
      })
      setView('dashboard')
    }
  }, [hasAccess, redirectOnDeny, toast, setView])

  if (hasAccess) return <>{children}</>

  return fallback ? <>{fallback}</> : (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-lg font-medium text-muted-foreground">Acceso restringido</p>
        <p className="text-sm text-muted-foreground mt-1">No tienes permisos para ver esta sección.</p>
      </div>
    </div>
  )
}
