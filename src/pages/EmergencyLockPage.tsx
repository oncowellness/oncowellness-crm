import { useState } from 'react'
import { ShieldAlert, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEmergencyLock } from '@/hooks/useEmergencyLock'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function EmergencyLockPage() {
  const { deactivateLockdown } = useEmergencyLock()
  const { isAdmin, signOut } = useAuth()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) {
      toast({ title: 'Acceso denegado', description: 'Solo administradores pueden desbloquear el sistema.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const success = await deactivateLockdown()
    if (success) {
      toast({ title: 'Sistema desbloqueado', description: 'El sistema ha sido restaurado.' })
    } else {
      toast({ title: 'Error', description: 'No se pudo desbloquear el sistema.', variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-950 to-red-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/5 blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-lg relative z-10 text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-red-600/20 border-2 border-red-500/50 rounded-2xl flex items-center justify-center animate-pulse">
          <ShieldAlert size={40} className="text-red-400" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-red-100 mb-2">🔒 Sistema Bloqueado</h1>
          <p className="text-red-300/70 text-sm max-w-sm mx-auto">
            El sistema Oncowellness CRM ha sido bloqueado por un administrador debido a un protocolo de emergencia. 
            Contacte al equipo de seguridad.
          </p>
          <p className="text-red-400/50 text-xs mt-4 font-mono uppercase tracking-wider">
            CRITICAL MAINTENANCE · EMERGENCY LOCKDOWN ACTIVE
          </p>
        </div>

        {isAdmin && (
          <form onSubmit={handleUnlock} className="bg-slate-900/60 border border-red-800/30 rounded-xl p-6 space-y-4 text-left">
            <p className="text-xs text-red-300/60 uppercase font-semibold tracking-wide">Panel de Administrador</p>
            <Input
              type="password"
              placeholder="Confirme su contraseña..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-800/60 border-red-800/30 text-red-100 placeholder:text-red-400/30"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white"
            >
              <Unlock size={16} className="mr-2" />
              {loading ? 'Desbloqueando...' : 'Desbloquear Sistema'}
            </Button>
          </form>
        )}

        <Button variant="ghost" onClick={signOut} className="text-red-400/50 hover:text-red-300 text-xs">
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
