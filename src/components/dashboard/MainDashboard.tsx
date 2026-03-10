import {
  Users, AlertTriangle, Activity, Brain, Calendar,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatients } from '@/hooks/usePatients'
import { useAllCrisisOrders } from '@/hooks/useAllCrisisOrders'
import { useAllSessions } from '@/hooks/useSessions'
import { PHASE_LABELS, type Phase } from '../../types'
import { formatDate, cn } from '../../lib/utils'
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FacitFWidget } from './FacitFWidget'

const PHASE_COLORS: Record<Phase, string> = {
  F1: 'bg-blue-100 text-blue-700',
  F2: 'bg-cyan-100 text-cyan-700',
  F3: 'bg-orange-100 text-orange-700',
  F4: 'bg-red-100 text-red-700',
  F5: 'bg-purple-100 text-purple-700',
  F6: 'bg-green-100 text-green-700',
  F7: 'bg-teal-100 text-teal-700',
  F8: 'bg-slate-100 text-slate-700',
}

export function MainDashboard() {
  const { setView, selectPatient } = useStore()
  const { data: patients = [], isLoading: pLoading } = usePatients()
  const { data: crisisOrders = [] } = useAllCrisisOrders()
  const { data: allSessions = [] } = useAllSessions()

  if (pLoading) return <DashboardSkeleton />

  const redAlerts = patients.filter(p => p.alert_status === 'rojo')
  const pendingCrisis = (crisisOrders ?? []).filter((c: any) => c.status === 'pendiente')
  const upcomingSessions = (allSessions ?? [])
    .filter((s: any) => s.status === 'confirmada' || s.status === 'pendiente')
    .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha))
    .slice(0, 6)

  const phaseDistribution = patients.reduce((acc, p) => {
    const phase = p.fase_journey as Phase
    acc[phase] = (acc[phase] ?? 0) + 1
    return acc
  }, {} as Record<Phase, number>)

  function openPatient(id: string) {
    selectPatient(id)
    setView('patient-detail')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pacientes', value: patients.length, icon: <Users size={18} />, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Alertas Rojas', value: redAlerts.length, icon: <AlertTriangle size={18} />, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Crisis Pendientes', value: pendingCrisis.length, icon: <Brain size={18} />, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Citas Próximas', value: upcomingSessions.length, icon: <Calendar size={18} />, color: 'text-teal-600', bg: 'bg-teal-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                <span className={s.color}>{s.icon}</span>
              </div>
            </div>
            <p className={cn('text-3xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Red alerts */}
      {redAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-sm font-bold text-red-700">Pacientes en Alerta Roja</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {redAlerts.map(p => (
              <button
                key={p.id}
                onClick={() => openPatient(p.id)}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200 hover:border-red-400 text-left w-full transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                  <p className="text-xs text-slate-500">{p.tipo_cancer} · Estadio {p.estadio}</p>
                  <p className="text-xs text-red-600 mt-0.5">Estado mental: {p.mind_state}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', PHASE_COLORS[p.fase_journey as Phase])}>
                  {p.fase_journey}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Próximas Citas</h3>
          </div>
          <div className="space-y-2">
            {upcomingSessions.map((s: any) => (
              <button
                key={s.id}
                onClick={() => openPatient(s.patient_id)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-700">{s.patients?.nombre ?? '—'}</p>
                  <p className="text-xs text-slate-400">{s.programa_code} · {s.therapist_name ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-teal-600">{formatDate(s.fecha)}</p>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    s.status === 'confirmada' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                  )}>
                    {s.status}
                  </span>
                </div>
              </button>
            ))}
            {upcomingSessions.length === 0 && (
              <EmptyState icon={Calendar} title="Sin citas próximas" description="Aún no hay sesiones programadas. Usa el Calendario para crear la primera cita." className="py-8" />
            )}
          </div>
        </div>

        {/* Phase distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Distribución por Fase</h3>
          </div>
          <div className="space-y-2">
            {(Object.keys(PHASE_LABELS) as Phase[]).map(phase => {
              const count = phaseDistribution[phase] ?? 0
              const percentage = patients.length > 0 ? (count / patients.length) * 100 : 0
              if (count === 0) return null
              return (
                <div key={phase} className="flex items-center gap-3">
                  <span className={cn('text-[11px] font-bold w-6 shrink-0', PHASE_COLORS[phase].replace('bg-', 'text-').split(' ')[1])}>
                    {phase}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs text-slate-600">{PHASE_LABELS[phase]}</p>
                      <p className="text-xs font-semibold text-slate-700">{count}</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full', PHASE_COLORS[phase].split(' ')[0])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Crisis orders */}
      {pendingCrisis.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Órdenes de Crisis Pendientes (PS-01)</h3>
          </div>
          <div className="space-y-2">
            {pendingCrisis.map((crisis: any) => (
              <button
                key={crisis.id}
                onClick={() => openPatient(crisis.patient_id)}
                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-red-700">{crisis.patients?.nombre ?? '—'}</p>
                  <p className="text-xs text-red-500">{crisis.trigger_reason}</p>
                </div>
                <span className="text-xs text-red-600 font-medium">{formatDate(crisis.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
