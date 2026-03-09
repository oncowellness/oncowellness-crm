import { useState } from 'react'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useEmergencyLock } from '@/hooks/useEmergencyLock'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export function EmergencyKillSwitch() {
  const { isLocked, activateLockdown, deactivateLockdown } = useEmergencyLock()
  const { log } = useAuditLog()
  const { toast } = useToast()

  const [step, setStep] = useState<'idle' | 'confirm' | 'reauth'>('idle')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReauth() {
    setLoading(true)
    try {
      // Re-authenticate by signing in again
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('No user')

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      })
      if (error) throw error

      // Activate lockdown
      const success = await activateLockdown(reason)
      if (success) {
        await log({
          action_type: 'lockdown_activate',
          resource_type: 'system',
          metadata: { reason },
        })
        toast({ title: '🔒 LOCKDOWN ACTIVADO', description: 'El sistema ha sido bloqueado.' })
      }
    } catch {
      toast({ title: 'Error de autenticación', description: 'Contraseña incorrecta.', variant: 'destructive' })
    } finally {
      setLoading(false)
      setStep('idle')
      setPassword('')
      setReason('')
    }
  }

  async function handleDeactivate() {
    const success = await deactivateLockdown()
    if (success) {
      await log({
        action_type: 'lockdown_deactivate',
        resource_type: 'system',
      })
      toast({ title: 'Sistema desbloqueado', description: 'El acceso ha sido restaurado.' })
    }
  }

  if (isLocked) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-red-300">
          <ShieldAlert size={18} />
          <span className="text-sm font-semibold">LOCKDOWN ACTIVO</span>
        </div>
        <Button onClick={handleDeactivate} variant="outline" size="sm" className="w-full border-red-600 text-red-300 hover:bg-red-900/50">
          Desbloquear Sistema
        </Button>
      </div>
    )
  }

  return (
    <AlertDialog open={step !== 'idle'} onOpenChange={(open) => !open && setStep('idle')}>
      <AlertDialogTrigger asChild>
        <Button
          onClick={() => setStep('confirm')}
          variant="destructive"
          className="w-full bg-red-700 hover:bg-red-600 border border-red-500/50 shadow-lg shadow-red-900/30"
        >
          <ShieldAlert size={16} className="mr-2" />
          EMERGENCY KILL SWITCH
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-slate-900 border-red-800/50">
        {step === 'confirm' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-300">
                <AlertTriangle size={20} />
                Confirmación de Bloqueo Global
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Esto cerrará TODAS las sesiones activas y bloqueará el acceso al sistema completo.
                Solo administradores podrán restaurar el acceso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Motivo del bloqueo (obligatorio)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="bg-slate-800 border-red-800/30 text-white"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!reason.trim()}
                onClick={(e) => { e.preventDefault(); setStep('reauth') }}
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                Continuar → Re-autenticación
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {step === 'reauth' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-300">
                Re-autenticación Requerida
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Ingrese su contraseña para confirmar la activación del bloqueo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="password"
              placeholder="Su contraseña..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-800 border-red-800/30 text-white"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={loading || !password}
                onClick={(e) => { e.preventDefault(); handleReauth() }}
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                {loading ? 'Verificando...' : '🔒 ACTIVAR LOCKDOWN'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
