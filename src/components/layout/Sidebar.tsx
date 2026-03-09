import {
  LayoutDashboard, Users, Activity, Brain, BookOpen, BarChart2, Package,
  Heart, CalendarDays, ChevronRight, Settings, Layers, Coins, Shield, UserPlus, Clock, Landmark, TrendingUp,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatients } from '@/hooks/usePatients'
import { useAllCrisisOrders } from '@/hooks/useAllCrisisOrders'
import { useAuth } from '@/contexts/AuthContext'
import { EmergencyKillSwitch } from '@/components/security/EmergencyKillSwitch'
import { SystemStatusIndicator } from '@/components/security/SystemStatusIndicator'
import type { View } from '../../types'
import { cn } from '../../lib/utils'

const TOP_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Inicio', icon: <LayoutDashboard size={18} />, view: 'dashboard' },
  { label: 'Pacientes', icon: <Users size={18} />, view: 'patients' },
]

const BOTTOM_NAV: { label: string; icon: React.ReactNode; view: View; adminOnly?: boolean; directorOnly?: boolean }[] = [
  { label: 'Calendario', icon: <CalendarDays size={18} />, view: 'calendar' },
  { label: 'Agenda Equipo', icon: <Users size={18} />, view: 'staff-calendar', adminOnly: true },
  { label: 'Actividad', icon: <Clock size={18} />, view: 'activity' },
  { label: 'Analítica', icon: <BarChart2 size={18} />, view: 'analytics', adminOnly: true },
  { label: 'Outcomes', icon: <TrendingUp size={18} />, view: 'outcomes', adminOnly: true },
  { label: 'Invitaciones', icon: <UserPlus size={18} />, view: 'invitations', adminOnly: true },
  { label: 'Liquidación', icon: <Coins size={18} />, view: 'incentives', adminOnly: true },
  { label: 'Finanzas', icon: <Landmark size={18} />, view: 'financial', adminOnly: true },
  { label: 'Gestión Personal', icon: <Shield size={18} />, view: 'staff-management', directorOnly: true },
  { label: 'Seguridad', icon: <Shield size={18} />, view: 'security' },
  { label: 'Configuración', icon: <Settings size={18} />, view: 'config-programs', adminOnly: true },
]

const CONFIG_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Programas', icon: <Layers size={16} />, view: 'config-programs' },
  { label: 'Packs', icon: <Package size={16} />, view: 'config-bundles' },
  { label: 'Contenido', icon: <BookOpen size={16} />, view: 'config-content' },
]

const PATIENT_NAV: { label: string; icon: React.ReactNode; view: View }[] = [
  { label: 'Ficha', icon: <Users size={16} />, view: 'patient-detail' },
  { label: 'Metas', icon: <Heart size={16} />, view: 'goals' },
  { label: 'Fisioterapia', icon: <Activity size={16} />, view: 'physio' },
  { label: 'Psico-oncología', icon: <Brain size={16} />, view: 'psycho' },
  { label: 'Empoderamiento', icon: <BookOpen size={16} />, view: 'empowerment' },
  { label: 'Bundles', icon: <Package size={16} />, view: 'bundles' },
  { label: 'Dashboard Clínico', icon: <BarChart2 size={16} />, view: 'clinical-dashboard' },
]

export function Sidebar() {
  const { view, setView, selectedPatientId } = useStore()
  const { data: patients = [] } = usePatients()
  const { data: crisisOrders = [] } = useAllCrisisOrders()
  const { isAdmin, profile, roles, hasRole, signOut } = useAuth()
  const isDirector = hasRole('director')

  const redAlerts = patients.filter(p => p.alert_status === 'rojo').length
  const pendingCrisis = (crisisOrders ?? []).filter((c: any) => c.status === 'pendiente').length

  const selectedPatient = patients.find(p => p.id === selectedPatientId)
  const showPatientMenu = selectedPatient && !['dashboard', 'calendar', 'staff-calendar', 'patients', 'config-programs', 'config-bundles', 'config-content', 'incentives', 'analytics', 'financial'].includes(view)
  const inConfig = view === 'config-programs' || view === 'config-bundles' || view === 'config-content'

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Oncowellness</p>
            <p className="text-xs text-slate-400">CRM Clínico</p>
          </div>
        </div>
      </div>

      {(redAlerts > 0 || pendingCrisis > 0) && (
        <div className="mx-3 mt-3 bg-red-900/50 border border-red-700 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-red-300">Alertas activas</p>
          {redAlerts > 0 && <p className="text-xs text-red-200">{redAlerts} paciente{redAlerts > 1 ? 's' : ''} en Alerta Roja</p>}
          {pendingCrisis > 0 && <p className="text-xs text-red-200">{pendingCrisis} orden{pendingCrisis > 1 ? 'es' : ''} de crisis pendiente{pendingCrisis > 1 ? 's' : ''}</p>}
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {TOP_NAV.map(item => (
          <button key={item.view} onClick={() => setView(item.view)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', view === item.view ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
            {item.icon}{item.label}
          </button>
        ))}

        {showPatientMenu && (
          <div className="my-2 py-2 border-y border-slate-800 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2 px-3 mb-2">
              <ChevronRight size={12} className="text-teal-400 shrink-0" />
              <p className="text-[11px] text-teal-400 font-semibold uppercase tracking-wide truncate">{selectedPatient.nombre}</p>
            </div>
            <div className="space-y-0.5">
              {PATIENT_NAV.map(item => (
                <button key={item.view} onClick={() => setView(item.view)} className={cn('w-full flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm font-medium transition-colors', view === item.view ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {BOTTOM_NAV.filter(item => {
          if (item.directorOnly && !isDirector) return false
          if (item.adminOnly && !isAdmin) return false
          return true
        }).map(item => (
          <div key={item.view}>
            <button onClick={() => setView(item.view)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', inConfig && item.view === 'config-programs' ? 'bg-teal-600 text-white' : view === item.view ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
              {item.icon}{item.label}
            </button>
            {item.view === 'config-programs' && inConfig && (
              <div className="mt-0.5 space-y-0.5">
                {CONFIG_NAV.map(sub => (
                  <button key={sub.view} onClick={() => setView(sub.view)} className={cn('w-full flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm font-medium transition-colors', view === sub.view ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white')}>
                    {sub.icon}{sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {isAdmin && (
        <div className="px-3 py-2 border-t border-slate-700">
          <EmergencyKillSwitch />
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-700">
        {profile && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {profile.nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{profile.nombre}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
              {roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {roles.map((r: string) => {
                    const label = r === 'admin' ? 'Admin' : r === 'director' ? 'Director' : r === 'fisioterapeuta' ? 'Fisio' : r === 'psiconcologo' ? 'Psico' : r === 'nutricionista' ? 'Nutri' : r === 'entrenador' ? 'Entren.' : r
                    return <span key={r} className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-medium">{label}</span>
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        <SystemStatusIndicator />
        <p className="text-[10px] text-slate-600">v1.0 · Modelo MSK</p>
      </div>
    </aside>
  )
}
