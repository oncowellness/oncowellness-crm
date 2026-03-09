import { useState, useRef, useEffect } from 'react'
import { Bell, Search, ChevronRight, LogOut, Clock, AlertTriangle, Brain, CheckCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useAlerts } from '@/hooks/useAlerts'
import { useAllCrisisOrders } from '@/hooks/useAllCrisisOrders'
import { useAuth } from '@/contexts/AuthContext'
import { PHASE_LABELS, type Phase } from '../../types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Panel Principal',
  patients: 'Gestión de Pacientes',
  'patient-detail': 'Historial del Paciente',
  physio: 'Módulo de Fisioterapia',
  psycho: 'Módulo de Psico-oncología',
  empowerment: 'Empoderamiento del Paciente',
  'clinical-dashboard': 'Dashboard Clínico',
  calendar: 'Calendario de Citas',
  bundles: 'Gestor de Bundles',
  incentives: 'Liquidación de Incentivos',
  security: 'Seguridad de la Cuenta',
  'config-programs': 'Configuración de Programas',
  'config-bundles': 'Configuración de Packs',
  activity: 'Actividad Reciente',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', director: 'Director', fisioterapeuta: 'Fisioterapeuta',
  psicologo: 'Psicólogo', psiconcologo: 'Psico-oncólogo', nutricionista: 'Nutricionista', entrenador: 'Entrenador',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function Header() {
  const { view, selectedPatientId, setView, selectPatient } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: alerts = [] } = useAlerts()
  const { data: crisisOrders = [] } = useAllCrisisOrders()
  const { profile, roles, signOut } = useAuth()

  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unresolvedAlerts = (alerts ?? []).filter((a: any) => !a.resolved)
  const pendingCrisis = (crisisOrders ?? []).filter((c: any) => c.status === 'pendiente')
  const totalBadge = unresolvedAlerts.length + pendingCrisis.length

  const initials = profile?.nombre ? profile.nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : 'OW'
  const primaryRole = roles.length > 0 ? ROLE_LABELS[roles[0]] ?? roles[0] : 'Sin rol'

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifs])

  const recentNotifs = [
    ...unresolvedAlerts.slice(0, 5).map((a: any) => ({
      id: a.id,
      icon: <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />,
      text: a.message ?? a.alert_type,
      time: a.created_at,
      severity: a.severity,
    })),
    ...pendingCrisis.slice(0, 3).map((c: any) => ({
      id: c.id,
      icon: <Brain size={14} className="text-red-600" />,
      text: c.trigger_reason,
      time: c.created_at,
      severity: 'critical',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Oncowellness CRM</span>
        <ChevronRight size={14} className="text-slate-400" />
        {view === 'patient-detail' && patient ? (
          <>
            <button onClick={() => { setView('patients'); selectPatient(null) }} className="text-slate-500 hover:text-teal-600">Pacientes</button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-medium text-slate-800">{patient.nombre}</span>
            <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {patient.fase_journey} · {PHASE_LABELS[patient.fase_journey as Phase]}
            </span>
          </>
        ) : (
          <span className="font-medium text-slate-800">{VIEW_TITLES[view] ?? view}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input type="text" placeholder="Buscar paciente..." className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52" />
        </div>

        {/* Notification bell with dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={18} className="text-slate-600" />
            {totalBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
                {totalBadge > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    {totalBadge} pendiente{totalBadge > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {recentNotifs.length === 0 ? (
                  <div className="flex flex-col items-center py-8 px-4">
                    <CheckCircle size={24} className="text-green-400 mb-2" />
                    <p className="text-xs text-slate-500">Sin notificaciones pendientes</p>
                  </div>
                ) : (
                  recentNotifs.map(n => (
                    <div key={n.id} className={cn(
                      'flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer',
                      n.severity === 'critical' && 'bg-red-50/40'
                    )}>
                      <div className="mt-0.5 shrink-0">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 line-clamp-2">{n.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(n.time)}</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => { setShowNotifs(false); setView('activity') }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-slate-100 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <Clock size={12} /> Ver toda la actividad
              </button>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">{initials}</div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-medium text-slate-800 leading-tight">{profile?.nombre ?? 'Usuario'}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{primaryRole}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.nombre}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
              <LogOut size={14} className="mr-2" />Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
