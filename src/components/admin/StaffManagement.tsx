import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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

const ASSIGNABLE_ROLES: AppRole[] = [
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
  role: AppRole | null
}

export function StaffManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState<string | null>(null)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff-management'],
    queryFn: async () => {
      // Fetch profiles and roles
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nombre, email, especialidad, suspended'),
        supabase.from('user_roles').select('user_id, role'),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (rolesRes.error) throw rolesRes.error

      const rolesMap = new Map<string, AppRole>()
      rolesRes.data.forEach(r => rolesMap.set(r.user_id, r.role))

      return (profilesRes.data ?? []).map(p => ({
        ...p,
        suspended: p.suspended ?? false,
        role: rolesMap.get(p.user_id) ?? null,
      })) as StaffRow[]
    },
  })

  async function handleRoleChange(staffUserId: string, newRole: AppRole) {
    setUpdating(staffUserId)
    try {
      // Delete existing role, then insert new one
      await supabase.from('user_roles').delete().eq('user_id', staffUserId)
      const { error } = await supabase.from('user_roles').insert({ user_id: staffUserId, role: newRole })
      if (error) throw error

      // Audit
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action_type: 'role_changed',
        resource_type: 'user_roles',
        resource_id: staffUserId,
        user_email: user!.email,
        metadata: { new_role: newRole },
      })

      toast({ title: 'Rol actualizado', description: `Rol cambiado a ${ROLE_LABELS[newRole]}` })
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

      toast({
        title: suspended ? 'Cuenta suspendida' : 'Cuenta reactivada',
      })
      queryClient.invalidateQueries({ queryKey: ['staff-management'] })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
          <ShieldCheck size={20} className="text-teal-500" />
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
                  <div key={s.user_id} className="flex items-center gap-4 py-3">
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

                    {/* Role selector */}
                    <div className="w-44">
                      <Select
                        value={s.role ?? ''}
                        onValueChange={(v) => handleRoleChange(s.user_id, v as AppRole)}
                        disabled={isSelf || updating === s.user_id}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Sin rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map(r => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 w-28 justify-end">
                      {s.suspended ? (
                        <Badge variant="destructive" className="text-[10px]">Suspendido</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">Activo</Badge>
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
