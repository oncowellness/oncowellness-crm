import { Bell, Search, ChevronRight, LogOut } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAuth } from '@/contexts/AuthContext'
import { PHASE_LABELS } from '../../types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  'config-programs': 'Configuración de Programas',
  'config-bundles': 'Configuración de Packs',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  director: 'Director',
  fisioterapeuta: 'Fisioterapeuta',
  psicologo: 'Psicólogo',
  psiconcologo: 'Psico-oncólogo',
  nutricionista: 'Nutricionista',
  entrenador: 'Entrenador',
}

export function Header() {
  const { view, patients, selectedPatientId, setView, selectPatient } = useStore()
  const { profile, roles, signOut } = useAuth()

  const patient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null
  const pendingAlerts = patients.reduce((acc, p) =>
    acc + p.crisisOrders.filter(c => c.status === 'pendiente').length, 0
  )

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'OW'

  const primaryRole = roles.length > 0 ? ROLE_LABELS[roles[0]] ?? roles[0] : 'Sin rol'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Oncowellness CRM</span>
        <ChevronRight size={14} className="text-slate-400" />
        {view === 'patient-detail' && patient ? (
          <>
            <button
              onClick={() => { setView('patients'); selectPatient(null) }}
              className="text-slate-500 hover:text-teal-600"
            >
              Pacientes
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-medium text-slate-800">{patient.name}</span>
            <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {patient.currentPhase} · {PHASE_LABELS[patient.currentPhase]}
            </span>
          </>
        ) : (
          <span className="font-medium text-slate-800">{VIEW_TITLES[view] ?? view}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-52"
          />
        </div>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg">
          <Bell size={18} className="text-slate-600" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
              {pendingAlerts}
            </span>
          )}
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
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
              <LogOut size={14} className="mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
