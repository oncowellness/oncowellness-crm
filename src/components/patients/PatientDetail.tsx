import { useState } from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, Calendar, Phone, Mail, Stethoscope, FileText, Package, Pencil, X, Save, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '../../store/useStore'
import { usePatient, useUpdatePatient } from '@/hooks/usePatients'
import { usePrograms } from '@/hooks/usePrograms'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { useSessions } from '@/hooks/useSessions'
import { useCrisisOrders, useAcknowledgeCrisis } from '@/hooks/useCrisisOrders'
import { useClinicalNotes } from '@/hooks/useClinicalNotes'
import { useLogPhaseTransition } from '@/hooks/useClinicalEvents'
import { useAuth } from '@/contexts/AuthContext'
import { JourneyTimeline } from './JourneyTimeline'
import { ClinicalPathwayProgress } from './ClinicalPathwayProgress'
import { ClinicalReport } from '../reports/ClinicalReport'
import { ClinicalTrends } from './ClinicalTrends'
import { FacitFWidget } from '../dashboard/FacitFWidget'
import { PhaseHistory } from './PhaseHistory'
import { PatientAdminInfo } from './PatientAdminInfo'
import { formatDate, cn } from '../../lib/utils'
import { PHASE_LABELS, type AlertStatus, type Phase, type MindState } from '../../types'

const CANCER_TYPES = [
  'Mama', 'Pulmón', 'Colon/Recto', 'Próstata', 'Linfoma', 'Leucemia',
  'Melanoma', 'Riñón', 'Vejiga', 'Ovario', 'Útero', 'Páncreas', 'Hígado', 'Otro',
]
const MIND_STATES: MindState[] = ['Activo', 'Ansioso', 'Depresivo', 'Resiliente', 'Vulnerable']
const PHASES = Object.keys(PHASE_LABELS) as Phase[]
const iCls = 'w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

const ALERT_CONFIG: Record<AlertStatus, { label: string; icon: React.ReactNode; classes: string; border: string }> = {
  verde: { label: 'Estable', icon: <CheckCircle size={16} />, classes: 'bg-green-50 text-green-700', border: 'border-green-200' },
  amarillo: { label: 'Requiere Atención', icon: <AlertCircle size={16} />, classes: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-200' },
  rojo: { label: 'ALERTA ROJA', icon: <AlertTriangle size={16} />, classes: 'bg-red-50 text-red-700', border: 'border-red-400' },
}

export function PatientDetail() {
  const { selectedPatientId } = useStore()
  const { data: patient, isLoading } = usePatient(selectedPatientId)
  const { data: programs = [] } = usePrograms()
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const { data: sessions = [] } = useSessions(selectedPatientId)
  const { data: crisisOrders = [] } = useCrisisOrders(selectedPatientId)
  const { data: clinicalNotes = [] } = useClinicalNotes(selectedPatientId)
  const updatePatient = useUpdatePatient()
  const acknowledgeCrisis = useAcknowledgeCrisis()
  const logPhaseTransition = useLogPhaseTransition()
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<any>({})

  if (isLoading) return <div className="p-6 text-slate-400">Cargando paciente...</div>
  if (!patient) return null

  const alertStatus = (patient.alert_status ?? 'verde') as AlertStatus
  const alert = ALERT_CONFIG[alertStatus]

  // Extract test data from clinical_tests
  const handgripTests = clinicalTests.filter(t => t.tipo === 'Handgrip')
  const sixMWTTests = clinicalTests.filter(t => t.tipo === '6MWT')
  const phq9Tests = clinicalTests.filter(t => t.tipo === 'PHQ-9')
  const facitfTests = clinicalTests.filter(t => t.tipo === 'FACIT-F')

  const latestHandgrip = handgripTests[handgripTests.length - 1]
  const baselineHandgrip = handgripTests.find(h => h.is_baseline)
  const latestSixMWT = sixMWTTests[sixMWTTests.length - 1]
  const baselineSixMWT = sixMWTTests.find(s => s.is_baseline)
  const latestPHQ9 = phq9Tests[phq9Tests.length - 1]
  const latestFACITF = facitfTests[facitfTests.length - 1]

  const assignedProgramDetails = programs.filter(pr => (patient.assigned_programs ?? []).includes(pr.code))
  const pendingCrisis = crisisOrders.filter(c => c.status === 'pendiente')

  function startEdit() {
    setDraft({
      nombre: patient!.nombre,
      edad: patient!.edad,
      genero: patient!.genero,
      email: patient!.email,
      telefono: patient!.telefono,
      diagnostico: patient!.diagnostico,
      tipo_cancer: patient!.tipo_cancer,
      estadio: patient!.estadio,
      oncologo_referente: patient!.oncologo_referente,
      fecha_diagnostico: patient!.fecha_diagnostico,
      fase_journey: patient!.fase_journey,
      mind_state: patient!.mind_state,
    })
    setEditing(true)
  }

  function saveEdit() {
    // Log phase transition if phase changed
    if (draft.fase_journey && draft.fase_journey !== patient!.fase_journey && user) {
      logPhaseTransition.mutate({
        patient_id: patient!.id,
        previous_phase: patient!.fase_journey,
        new_phase: draft.fase_journey,
        performed_by: user.id,
        performed_by_name: profile?.nombre ?? user.email ?? 'Unknown',
      }, {
        onError: () => toast({
          title: 'Advertencia',
          description: 'No se pudo registrar el cambio de fase en el historial.',
          variant: 'destructive',
        }),
      })
    }
    updatePatient.mutate({ id: patient!.id, ...draft }, {
      onSuccess: () => setEditing(false),
      onError: () => toast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar los cambios del paciente.',
        variant: 'destructive',
      }),
    })
  }

  // Helper to get numeric value from clinical test
  const getVal = (test: any) => test?.valor_numerico ?? null
  const getJson = (test: any) => test?.valores_json as any

  return (
    <div className="p-6 space-y-5">
      {/* Crisis banner */}
      {pendingCrisis.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">
              {pendingCrisis.length} Orden{pendingCrisis.length > 1 ? 'es' : ''} de Crisis Pendiente{pendingCrisis.length > 1 ? 's' : ''}
            </p>
            {pendingCrisis.map(c => (
              <div key={c.id} className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-200">
                <div>
                  <p className="text-xs font-semibold text-red-700">PS-01: Intervención en Crisis</p>
                  <p className="text-xs text-red-500">{c.trigger_reason} · {formatDate(c.created_at)}</p>
                </div>
                <button
                  onClick={() => acknowledgeCrisis.mutate(c.id)}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                >
                  Marcar Atendida
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient header card */}
      <div className={cn('bg-white rounded-xl border p-5', alert.border)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xl font-bold shrink-0">
              {patient.nombre.charAt(0)}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium">Nombre</label>
                  <input className={iCls} value={draft.nombre ?? ''} onChange={e => setDraft((d: any) => ({ ...d, nombre: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Edad</label>
                  <input type="number" className={iCls} value={draft.edad ?? ''} onChange={e => setDraft((d: any) => ({ ...d, edad: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Sexo</label>
                  <select className={iCls} value={draft.genero} onChange={e => setDraft((d: any) => ({ ...d, genero: e.target.value }))}>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium">Diagnóstico</label>
                  <input className={iCls} value={draft.diagnostico ?? ''} onChange={e => setDraft((d: any) => ({ ...d, diagnostico: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Tipo de cáncer</label>
                  <select className={iCls} value={draft.tipo_cancer ?? ''} onChange={e => setDraft((d: any) => ({ ...d, tipo_cancer: e.target.value }))}>
                    <option value="">— Sin especificar —</option>
                    {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium">Estadio TNM</label>
                  <input className={iCls} value={draft.estadio ?? ''} onChange={e => setDraft((d: any) => ({ ...d, estadio: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-slate-800">{patient.nombre}</h2>
                <p className="text-sm text-slate-500">
                  {patient.edad} años · {patient.genero === 'F' ? 'Mujer' : 'Hombre'} · {patient.tipo_cancer} Estadio {patient.estadio}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{patient.diagnostico}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={cn('flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full', alert.classes)}>
              {alert.icon} {alert.label}
            </span>
            {editing ? (
              <select className="text-xs border border-slate-200 rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={draft.mind_state} onChange={e => setDraft((d: any) => ({ ...d, mind_state: e.target.value }))}>
                {MIND_STATES.map(ms => <option key={ms} value={ms}>{ms}</option>)}
              </select>
            ) : (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Estado mental: {patient.mind_state}
              </span>
            )}
            {editing ? (
              <div className="flex gap-1.5 mt-1">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50"><X size={12} /> Cancelar</button>
                <button onClick={saveEdit} className="flex items-center gap-1 text-xs text-white bg-teal-600 px-2.5 py-1 rounded-lg hover:bg-teal-700"><Save size={12} /> Guardar</button>
              </div>
            ) : (
              <button onClick={startEdit} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 mt-1"><Pencil size={12} /> Editar</button>
            )}
          </div>
        </div>

        {/* Contact & clinical info */}
        {editing ? (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div><label className="text-[10px] text-slate-400 font-medium block mb-0.5">Email</label><input type="email" className={iCls} value={draft.email ?? ''} onChange={e => setDraft((d: any) => ({ ...d, email: e.target.value }))} /></div>
            <div><label className="text-[10px] text-slate-400 font-medium block mb-0.5">Teléfono</label><input type="tel" className={iCls} value={draft.telefono ?? ''} onChange={e => setDraft((d: any) => ({ ...d, telefono: e.target.value }))} /></div>
            <div><label className="text-[10px] text-slate-400 font-medium block mb-0.5">Oncólogo/a</label><input className={iCls} value={draft.oncologo_referente ?? ''} onChange={e => setDraft((d: any) => ({ ...d, oncologo_referente: e.target.value }))} /></div>
            <div><label className="text-[10px] text-slate-400 font-medium block mb-0.5">Fecha diagnóstico</label><input type="date" className={iCls} value={draft.fecha_diagnostico ?? ''} onChange={e => setDraft((d: any) => ({ ...d, fecha_diagnostico: e.target.value }))} /></div>
            <div className="col-span-2 lg:col-span-4">
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Fase del Journey</label>
              <div className="flex flex-wrap gap-1.5">
                {PHASES.map(phase => (
                  <button key={phase} onClick={() => setDraft((d: any) => ({ ...d, fase_journey: phase }))}
                    className={cn('text-xs px-2.5 py-1 rounded-full border font-medium transition-colors', draft.fase_journey === phase ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300')}>
                    {phase} · {PHASE_LABELS[phase]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600"><Mail size={13} className="text-slate-400" />{patient.email || <span className="text-slate-300 italic">Sin email</span>}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={13} className="text-slate-400" />{patient.telefono || <span className="text-slate-300 italic">Sin teléfono</span>}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><Stethoscope size={13} className="text-slate-400" />{patient.oncologo_referente}</div>
            <div className="flex items-center gap-2 text-xs text-slate-600"><Calendar size={13} className="text-slate-400" />Dx: {patient.fecha_diagnostico ? formatDate(patient.fecha_diagnostico) : '—'}</div>
          </div>
        )}
      </div>

      {/* Clinical Pathway Progress (MSK F1-F8) */}
      <ClinicalPathwayProgress currentPhase={patient.fase_journey as Phase} />

      {/* Administrative Info */}
      <PatientAdminInfo patient={patient as any} />

      {/* Journey timeline + Phase History */}
      <JourneyTimeline currentPhase={patient.fase_journey as Phase} mindState={patient.mind_state ?? 'Activo'} />
      <PhaseHistory patientId={patient.id} />

      {/* FACIT-F Fatigue Evolution */}
      <FacitFWidget patientId={patient.id} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip (dominante)</p>
          <p className="text-2xl font-bold text-slate-800">{latestHandgrip ? `${getVal(latestHandgrip)} kg` : 'N/D'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT (distancia)</p>
          <p className="text-2xl font-bold text-slate-800">{latestSixMWT ? `${getVal(latestSixMWT)} m` : 'N/D'}</p>
        </div>
        <div className={cn('rounded-xl border p-4', latestPHQ9 && getVal(latestPHQ9) >= 10 ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200')}>
          <p className="text-xs text-slate-500 mb-1">PHQ-9 (último)</p>
          <p className={cn('text-2xl font-bold', latestPHQ9 && getVal(latestPHQ9) >= 10 ? 'text-red-600' : 'text-slate-800')}>
            {latestPHQ9 ? getVal(latestPHQ9) : 'N/D'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">FACIT-F (fatiga)</p>
          <p className="text-2xl font-bold text-slate-800">{latestFACITF ? getVal(latestFACITF) : 'N/D'}</p>
          <p className="text-xs text-slate-400 mt-1">Rango 0–52 (mayor = mejor)</p>
        </div>
      </div>

      {/* Clinical Trends Charts */}
      <ClinicalTrends tests={clinicalTests} />

      {/* Programs & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Programas Activos</h3>
          </div>
          <div className="space-y-2">
            {assignedProgramDetails.map(prog => (
              <div key={prog.code} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{prog.code} – {prog.nombre}</p>
                  <p className="text-xs text-slate-400">{prog.descripcion}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                  prog.tipo === 'FX' && 'bg-blue-100 text-blue-700',
                  prog.tipo === 'PS' && 'bg-purple-100 text-purple-700',
                  prog.tipo === 'NU' && 'bg-green-100 text-green-700',
                  prog.tipo === 'EO' && 'bg-pink-100 text-pink-700',
                  prog.tipo === 'TS' && 'bg-orange-100 text-orange-700',
                )}>{prog.tipo}</span>
              </div>
            ))}
            {assignedProgramDetails.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin programas asignados</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Sesiones Recientes</h3>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 6).map(session => {
              const prog = programs.find(p => p.code === session.programa_code)
              return (
                <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{session.programa_code} – {prog?.nombre}</p>
                    <p className="text-xs text-slate-400">{formatDate(session.fecha)} · {session.therapist_name ?? '—'}</p>
                    {session.notas && <p className="text-xs text-slate-500 italic">{session.notas}</p>}
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    session.status === 'realizada' && 'bg-green-100 text-green-700',
                    session.status === 'confirmada' && 'bg-blue-100 text-blue-700',
                    session.status === 'pendiente' && 'bg-yellow-100 text-yellow-700',
                    session.status === 'cancelada' && 'bg-red-100 text-red-700',
                  )}>{session.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Clinical Report PDF */}
      <ClinicalReport />

      {/* Clinical notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-700">Notas Clínicas</h3>
        </div>
        <div className="space-y-3">
          {clinicalNotes.map(note => (
            <div key={note.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">{note.author_name ?? '—'}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full',
                    note.tipo === 'interconsulta' && 'bg-blue-100 text-blue-600',
                    note.tipo === 'evolucion' && 'bg-green-100 text-green-600',
                    note.tipo === 'incidencia' && 'bg-red-100 text-red-600',
                  )}>{note.tipo}</span>
                  <span className="text-xs text-slate-400">{formatDate(note.created_at)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
