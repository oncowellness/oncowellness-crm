import { useState } from 'react'
import { Shield, Key, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { validatePassword } from '@/lib/passwordPolicy'

export function SecurityDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const { data: auditLogs } = useQuery({
    queryKey: ['my-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
    enabled: !!user,
  })

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      toast({ title: 'Contraseña insegura', description: validation.errors[0], variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'destructive' })
      return
    }

    setChangingPw(true)
    try {
      // Verify current password server-side without session side effects
      const { data: verified, error: verifyError } = await supabase.rpc('verify_current_password', {
        _password: currentPassword,
      })
      if (verifyError || !verified) throw new Error('Contraseña actual incorrecta')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setChangingPw(false)
    }
  }

  const passwordValidation = validatePassword(newPassword)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-teal-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Seguridad de la Cuenta</h2>
          <p className="text-sm text-slate-500">Gestiona tu contraseña y revisa tu actividad</p>
        </div>
      </div>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key size={16} />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <Label>Contraseña actual</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Nueva contraseña (mínimo 14 caracteres)</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={14} />
              {newPassword && (
                <ul className="text-xs mt-1 space-y-0.5">
                  {passwordValidation.checks.map((c, i) => (
                    <li key={i} className={c.passed ? 'text-emerald-600' : 'text-red-500'}>
                      {c.passed ? '✓' : '✗'} {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-1">
              <Label>Confirmar nueva contraseña</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={changingPw || !passwordValidation.isValid}>
              {changingPw ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock size={16} />
            Sesión Activa
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p><span className="font-medium">Email:</span> {profile?.email}</p>
          <p><span className="font-medium">Auto-cierre:</span> 10 minutos de inactividad</p>
          <p><span className="font-medium">Sesiones simultáneas:</span> 1 (limitado)</p>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye size={16} />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {auditLogs.map(l => (
                <div key={l.id} className="py-2 text-xs flex items-center justify-between">
                  <span className="text-slate-600">
                    <span className="font-medium text-slate-800">{l.action_type}</span>
                    {' → '}{l.resource_type}
                    {l.resource_id && <span className="text-slate-400 ml-1">({l.resource_id.slice(0, 8)})</span>}
                  </span>
                  <span className="text-slate-400">{new Date(l.created_at).toLocaleString('es-ES')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sin actividad registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
