import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type AppRole = Database['public']['Enums']['app_role']

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  director: 'Director',
  fisioterapeuta: 'Fisioterapeuta',
  psiconcologo: 'Psico-oncólogo',
  psicologo: 'Psicólogo',
  nutricionista: 'Nutricionista',
  entrenador: 'Entrenador',
}

const ALL_ROLES: AppRole[] = [
  'director',
  'admin',
  'fisioterapeuta',
  'psiconcologo',
  'psicologo',
  'nutricionista',
  'entrenador',
]

interface StaffRow {
  user_id: string
  nombre: string
  email: string | null
  especialidad: string | null
  suspended: boolean
  roles: AppRole[]
}

export function StaffManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState<string | null>(null)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff-management'],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nombre, email, especialidad, suspended'),
        supabase.from('user_roles').select('user_id, role'),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (rolesRes.error) throw rolesRes.error

      const rolesMap = new Map<string, AppRole[]>()
      rolesRes.data.forEach(r => {
        const existing = rolesMap.get(r.user_id) ?? []
        existing.push(r.role)
        rolesMap.set(r.user_id, existing)
      })

      return (profilesRes.data ?? []).map(p => ({
        ...p,
        suspended: p.suspended ?? false,
        roles: rolesMap.get(p.user_id) ?? [],
      })) as StaffRow[]
    },
  })

  async function handleRoleToggle(staffUserId: string, role: AppRole, enabled: boolean) {
    setUpdating(staffUserId)
    try {
      if (enabled) {
        const { error } = await supabase.from('user_roles').insert({ user_id: staffUserId, role })
        if (error) throw error
      } else {
        const { error } = await supabase.from('user_roles').delete()
          .eq('user_id', staffUserId)
          .eq('role', role)
        if (error) throw error
      }

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action_type: enabled ? 'role_added' : 'role_removed',
        resource_type: 'user_roles',
        resource_id: staffUserId,
        user_email: user!.email,
        metadata: { role, action: enabled ? 'added' : 'removed' },
      })

      toast({
        title: enabled ? 'Rol asignado' : 'Rol eliminado',
        description: `${ROLE_LABELS[role]} ${enabled ? 'añadido' : 'eliminado'}`,
      })
      queryClient.invalidateQueries({ queryKey: ['staff-management'] })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  async function handleSuspendToggle(staffUserId: string, suspended: boolean) {
    setUpdating(staffUserId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended })
        .eq('user_id', staffUserId)
      if (error) throw error

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action_type: suspended ? 'account_suspended' : 'account_reactivated',
        resource_type: 'profiles',
        resource_id: staffUserId,
        user_email: user!.email,
      })

      toast({ title: suspended ? 'Cuenta suspendida' : 'Cuenta reactivada' })
      queryClient.invalidateQueries({ queryKey: ['staff-management'] })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <ShieldCheck size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Gestión de Personal</h2>
          <p className="text-sm text-muted-foreground">Administra roles y estado de cuentas (solo Director)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={16} />
            Equipo ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay miembros registrados.</p>
          ) : (
            <div className="divide-y divide-border">
              {staff.map(s => {
                const isSelf = s.user_id === user?.id
                return (
                  <div key={s.user_id} className="py-4 space-y-3">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                        {s.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.nombre}
                          {isSelf && <span className="text-muted-foreground ml-1">(tú)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {s.suspended ? (
                          <Badge variant="destructive" className="text-[10px]">Suspendido</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Activo</Badge>
                        )}
                        {!isSelf && (
                          <Switch
                            checked={!s.suspended}
                            onCheckedChange={(checked) => handleSuspendToggle(s.user_id, !checked)}
                            disabled={updating === s.user_id}
                          />
                        )}
                      </div>
                    </div>

                    {/* Multi-role checkboxes */}
                    <div className="pl-13 flex flex-wrap gap-x-5 gap-y-2 ml-13">
                      {ALL_ROLES.map(role => {
                        const hasRole = s.roles.includes(role)
                        return (
                          <label
                            key={role}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={hasRole}
                              onCheckedChange={(checked) => handleRoleToggle(s.user_id, role, !!checked)}
                              disabled={isSelf || updating === s.user_id}
                            />
                            <span className="text-xs text-foreground">{ROLE_LABELS[role]}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
