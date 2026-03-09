import { useState, useMemo } from 'react'
import { Search, Filter, AlertTriangle, CheckCircle, AlertCircle, User, UserPlus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatients } from '@/hooks/usePatients'
import { PHASE_LABELS, type Phase, type AlertStatus } from '../../types'
import { formatDate, cn } from '../../lib/utils'
import { NewPatientModal } from './NewPatientModal'

const ALERT_CONFIG: Record<AlertStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  verde: { label: 'Estable', icon: <CheckCircle size={14} />, classes: 'bg-green-100 text-green-700' },
  amarillo: { label: 'Atención', icon: <AlertCircle size={14} />, classes: 'bg-yellow-100 text-yellow-700' },
  rojo: { label: 'Alerta Roja', icon: <AlertTriangle size={14} />, classes: 'bg-red-100 text-red-700' },
}

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

export function PatientList() {
  const { setView, selectPatient } = useStore()
  const { data: patients = [], isLoading } = usePatients()
  const [search, setSearch] = useState('')
  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all')
  const [filterAlert, setFilterAlert] = useState<AlertStatus | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.tipo_cancer ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.oncologo_referente ?? '').toLowerCase().includes(search.toLowerCase())
      const matchPhase = filterPhase === 'all' || p.fase_journey === filterPhase
      const matchAlert = filterAlert === 'all' || p.alert_status === filterAlert
      return matchSearch && matchPhase && matchAlert
    })
  }, [patients, search, filterPhase, filterAlert])

  function openPatient(id: string) {
    selectPatient(id)
    setView('patient-detail')
  }

  const redCount = useMemo(() => patients.filter(p => p.alert_status === 'rojo').length, [patients])
  const yellowCount = useMemo(() => patients.filter(p => p.alert_status === 'amarillo').length, [patients])

  function handleCreated(id: string) {
    setShowNewModal(false)
    if (id) { selectPatient(id); setView('patient-detail') }
  }

  if (isLoading) return <div className="p-6 text-slate-400">Cargando pacientes...</div>

  return (
    <div className="p-6 space-y-5">
      {showNewModal && (
        <NewPatientModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}

      {/* Summary stats + Add button */}
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-4 gap-4 flex-1">
          {[
            { label: 'Total Pacientes', value: patients.length, color: 'text-slate-700', bg: 'bg-white' },
            { label: 'Alerta Roja', value: redCount, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Atención', value: yellowCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Estables', value: patients.length - redCount - yellowCount, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-teal-700 shrink-0 shadow-sm"
        >
          <UserPlus size={16} /> Añadir Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo de cáncer u oncólogo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterPhase}
            onChange={e => setFilterPhase(e.target.value as Phase | 'all')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="all">Todas las fases</option>
            {(Object.keys(PHASE_LABELS) as Phase[]).map(f => (
              <option key={f} value={f}>{f} – {PHASE_LABELS[f]}</option>
            ))}
          </select>
          <select
            value={filterAlert}
            onChange={e => setFilterAlert(e.target.value as AlertStatus | 'all')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="all">Todos los estados</option>
            <option value="verde">Estable</option>
            <option value="amarillo">Atención</option>
            <option value="rojo">Alerta Roja</option>
          </select>
        </div>
      </div>

      {/* Patient table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Paciente</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Diagnóstico</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Oncólogo</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fase</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado Mental</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient, i) => {
              const alertStatus = (patient.alert_status ?? 'verde') as AlertStatus
              const alert = ALERT_CONFIG[alertStatus]
              const phase = patient.fase_journey as Phase
              return (
                <tr
                  key={patient.id}
                  onClick={() => openPatient(patient.id)}
                  className={cn(
                    'border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors',
                    alertStatus === 'rojo' && 'bg-red-50/40 hover:bg-red-50',
                    i === filtered.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <User size={14} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{patient.nombre}</p>
                        <p className="text-xs text-slate-500">{patient.edad} años · {patient.genero === 'F' ? 'Mujer' : 'Hombre'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{patient.tipo_cancer}</p>
                    <p className="text-xs text-slate-400">Estadio {patient.estadio}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{patient.oncologo_referente}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', PHASE_COLORS[phase])}>
                      {phase} · {PHASE_LABELS[phase]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                      {patient.mind_state}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit', alert.classes)}>
                      {alert.icon}{alert.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {patient.fecha_diagnostico ? formatDate(patient.fecha_diagnostico) : '—'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                  No se encontraron pacientes con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
