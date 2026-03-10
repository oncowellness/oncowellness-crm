import { useState, useEffect } from 'react'
import { X, Save, ChevronLeft, ChevronRight, Stethoscope, Brain, ClipboardList, CalendarCheck, AlertTriangle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatDate } from '@/lib/utils'
import { useCreateEncounter, useUpdateEncounter, type EncounterRow } from '@/hooks/useEncounters'
import { useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { useUpdatePatient } from '@/hooks/usePatients'
import { useLogPhaseTransition } from '@/hooks/useClinicalEvents'
import { usePrograms } from '@/hooks/usePrograms'
import { useAuth } from '@/contexts/AuthContext'
import { PHASE_LABELS, type Phase } from '@/types'
import { toast } from 'sonner'

interface Props {
  patientId: string
  patientName: string
  currentPhase: string
  existingEncounter?: EncounterRow | null
  baselineMetrics: {
    handgrip?: number | null
    sixMWT?: number | null
    thirtySTS?: number | null
    phq9?: number | null
    facitf?: number | null
  }
  onClose: () => void
}

const STATUS_TAGS = ['Estable', 'Mejoría', 'Deterioro', 'Toxicidad detectada', 'Dolor controlado', 'Dolor no controlado', 'Fatiga significativa', 'Buena tolerancia']

const iCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

export function EncounterForm({ patientId, patientName, currentPhase, existingEncounter, baselineMetrics, onClose }: Props) {
  const { user, profile } = useAuth()
  const { data: programs = [] } = usePrograms()
  const createEncounter = useCreateEncounter()
  const updateEncounter = useUpdateEncounter()
  const createClinicalTest = useCreateClinicalTest()
  const updatePatient = useUpdatePatient()
  const logPhaseTransition = useLogPhaseTransition()

  const isEditing = !!existingEncounter
  const [tab, setTab] = useState('subjective')

  const [encounterType, setEncounterType] = useState<string>(existingEncounter?.encounter_type ?? 'successive')
  const [durationMin, setDurationMin] = useState(existingEncounter?.duration_minutes ?? (encounterType === 'initial' ? 90 : 60))

  // Subjective
  const [chiefComplaint, setChiefComplaint] = useState(existingEncounter?.subjective?.chief_complaint ?? '')
  const [painScale, setPainScale] = useState<number | null>(existingEncounter?.subjective?.pain_scale ?? null)
  const [fatigueScale, setFatigueScale] = useState<number | null>(existingEncounter?.subjective?.fatigue_scale ?? null)
  const [patientNarrative, setPatientNarrative] = useState(existingEncounter?.subjective?.narrative ?? '')

  // Objective
  const [handgrip, setHandgrip] = useState<string>(existingEncounter?.objective?.handgrip ?? '')
  const [sixMWT, setSixMWT] = useState<string>(existingEncounter?.objective?.six_mwt ?? '')
  const [thirtySTS, setThirtySTS] = useState<string>(existingEncounter?.objective?.thirty_sts ?? '')
  const [tug, setTug] = useState<string>(existingEncounter?.objective?.tug ?? '')
  const [vitals, setVitals] = useState({
    systolic: existingEncounter?.objective?.vitals?.systolic ?? '',
    diastolic: existingEncounter?.objective?.vitals?.diastolic ?? '',
    heart_rate: existingEncounter?.objective?.vitals?.heart_rate ?? '',
    spo2: existingEncounter?.objective?.vitals?.spo2 ?? '',
    weight: existingEncounter?.objective?.vitals?.weight ?? '',
  })

  // Assessment
  const [clinicalNotes, setClinicalNotes] = useState(existingEncounter?.assessment?.notes ?? '')
  const [statusTags, setStatusTags] = useState<string[]>(existingEncounter?.assessment?.status_tags ?? [])

  // Plan
  const [prescribedPrograms, setPrescribedPrograms] = useState<string[]>(existingEncounter?.plan?.prescribed_programs ?? [])
  const [planNotes, setPlanNotes] = useState(existingEncounter?.plan?.notes ?? '')
  const [triggerPhaseTransition, setTriggerPhaseTransition] = useState(existingEncounter?.triggers_phase_transition ?? false)
  const [newPhase, setNewPhase] = useState(existingEncounter?.new_phase ?? '')

  useEffect(() => {
    setDurationMin(encounterType === 'initial' ? 90 : 60)
  }, [encounterType])

  const toggleTag = (tag: string) => {
    setStatusTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const toggleProgram = (code: string) => {
    setPrescribedPrograms(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  async function handleSave(finalStatus: 'in_progress' | 'completed') {
    if (!user) return

    const subjectiveData = {
      chief_complaint: chiefComplaint,
      pain_scale: painScale,
      fatigue_scale: fatigueScale,
      narrative: patientNarrative,
    }
    const objectiveData = {
      handgrip: handgrip || null,
      six_mwt: sixMWT || null,
      thirty_sts: thirtySTS || null,
      tug: tug || null,
      vitals,
    }
    const assessmentData = {
      notes: clinicalNotes,
      status_tags: statusTags,
    }
    const planData = {
      prescribed_programs: prescribedPrograms,
      notes: planNotes,
    }

    const payload: any = {
      patient_id: patientId,
      staff_id: user.id,
      staff_name: profile?.nombre ?? user.email,
      encounter_type: encounterType,
      phase_at_encounter: currentPhase,
      duration_minutes: durationMin,
      subjective: subjectiveData,
      objective: objectiveData,
      assessment: assessmentData,
      plan: planData,
      triggers_phase_transition: triggerPhaseTransition,
      new_phase: triggerPhaseTransition ? newPhase : null,
      status: finalStatus,
      completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
    }

    try {
      if (isEditing) {
        await updateEncounter.mutateAsync({ id: existingEncounter!.id, ...payload })
      } else {
        await createEncounter.mutateAsync(payload)
      }

      // On completion: sync metrics to clinical_tests
      if (finalStatus === 'completed') {
        const testPromises: Promise<any>[] = []
        if (handgrip) {
          testPromises.push(createClinicalTest.mutateAsync({
            patient_id: patientId, tipo: 'Handgrip', valor_numerico: parseFloat(handgrip), staff_id: user.id,
            is_baseline: encounterType === 'initial',
          }))
        }
        if (sixMWT) {
          testPromises.push(createClinicalTest.mutateAsync({
            patient_id: patientId, tipo: '6MWT', valor_numerico: parseFloat(sixMWT), staff_id: user.id,
            is_baseline: encounterType === 'initial',
          }))
        }
        if (thirtySTS) {
          testPromises.push(createClinicalTest.mutateAsync({
            patient_id: patientId, tipo: '30STS', valor_numerico: parseFloat(thirtySTS), staff_id: user.id,
            is_baseline: encounterType === 'initial',
          }))
        }
        if (tug) {
          testPromises.push(createClinicalTest.mutateAsync({
            patient_id: patientId, tipo: 'TUG', valor_numerico: parseFloat(tug), staff_id: user.id,
            is_baseline: encounterType === 'initial',
          }))
        }
        if (painScale !== null) {
          testPromises.push(createClinicalTest.mutateAsync({
            patient_id: patientId, tipo: 'EVA', valor_numerico: painScale, staff_id: user.id,
          }))
        }
        await Promise.all(testPromises)

        // Phase transition
        if (triggerPhaseTransition && newPhase && newPhase !== currentPhase) {
          await updatePatient.mutateAsync({ id: patientId, fase_journey: newPhase as any, assigned_programs: prescribedPrograms.length > 0 ? prescribedPrograms : undefined } as any)
          await logPhaseTransition.mutateAsync({
            patient_id: patientId,
            previous_phase: currentPhase,
            new_phase: newPhase,
            performed_by: user.id,
            performed_by_name: profile?.nombre ?? user.email ?? '',
            reason: `Visita ${encounterType} completada`,
          })
        } else if (prescribedPrograms.length > 0) {
          await updatePatient.mutateAsync({ id: patientId, assigned_programs: prescribedPrograms } as any)
        }
      }

      toast.success(finalStatus === 'completed' ? 'Visita completada y métricas sincronizadas' : 'Visita guardada como borrador')
      onClose()
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message)
    }
  }

  const BaselineHint = ({ label, value, unit }: { label: string; value?: number | null; unit: string }) => (
    value != null ? (
      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full ml-2">
        Basal: {value} {unit}
      </span>
    ) : null
  )

  const PHASES = Object.keys(PHASE_LABELS) as Phase[]

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope size={20} className="text-teal-600" />
              {isEditing ? 'Editar Visita' : 'Nueva Visita Clínica'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{patientName} · Fase {currentPhase} ({PHASE_LABELS[currentPhase as Phase]})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={20} /></button>
        </div>

        {/* Type selector */}
        <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-3">
          <label className="text-xs font-medium text-slate-500">Tipo:</label>
          <div className="flex gap-1.5">
            {[
              { val: 'initial', label: 'Inicial (90 min)', icon: '🏥' },
              { val: 'successive', label: 'Sucesiva (60 min)', icon: '🔄' },
              { val: 'phase_transition', label: 'Transición de Fase', icon: '📈' },
              { val: 'emergency', label: 'Urgencia', icon: '🚨' },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => {
                  setEncounterType(opt.val)
                  if (opt.val === 'phase_transition') setTriggerPhaseTransition(true)
                }}
                className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                  encounterType === opt.val ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                )}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="px-6 pt-3 bg-transparent justify-start gap-1">
            <TabsTrigger value="subjective" className="text-xs gap-1.5 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
              <Brain size={14} /> Subjetivo / Síntomas
            </TabsTrigger>
            <TabsTrigger value="objective" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Stethoscope size={14} /> Objetivo / Métricas
            </TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs gap-1.5 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <ClipboardList size={14} /> Evaluación
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <CalendarCheck size={14} /> Plan
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* SUBJECTIVE */}
            <TabsContent value="subjective" className="mt-0 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Motivo de consulta</label>
                <Textarea className="min-h-[80px]" placeholder="Describe el motivo principal de la visita..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Dolor (EVA 0-10)</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button key={i} onClick={() => setPainScale(i)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-bold border transition-all',
                          painScale === i
                            ? i <= 3 ? 'bg-green-500 text-white border-green-600'
                              : i <= 6 ? 'bg-yellow-500 text-white border-yellow-600'
                              : 'bg-red-500 text-white border-red-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        )}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Fatiga (0-10)</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button key={i} onClick={() => setFatigueScale(i)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-bold border transition-all',
                          fatigueScale === i
                            ? i <= 3 ? 'bg-green-500 text-white border-green-600'
                              : i <= 6 ? 'bg-yellow-500 text-white border-yellow-600'
                              : 'bg-red-500 text-white border-red-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        )}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Narrativa del paciente</label>
                <Textarea className="min-h-[100px]" placeholder="Lo que el paciente refiere en sus propias palabras..." value={patientNarrative} onChange={e => setPatientNarrative(e.target.value)} />
              </div>
            </TabsContent>

            {/* OBJECTIVE */}
            <TabsContent value="objective" className="mt-0 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Pruebas Funcionales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 flex items-center mb-1">
                      Handgrip (kg)
                      <BaselineHint label="Basal" value={baselineMetrics.handgrip} unit="kg" />
                    </label>
                    <input type="number" step="0.1" className={iCls} placeholder="ej: 28.5" value={handgrip} onChange={e => setHandgrip(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 flex items-center mb-1">
                      6MWT (metros)
                      <BaselineHint label="Basal" value={baselineMetrics.sixMWT} unit="m" />
                    </label>
                    <input type="number" className={iCls} placeholder="ej: 420" value={sixMWT} onChange={e => setSixMWT(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 flex items-center mb-1">
                      30STS (reps)
                      <BaselineHint label="Basal" value={baselineMetrics.thirtySTS} unit="reps" />
                    </label>
                    <input type="number" className={iCls} placeholder="ej: 12" value={thirtySTS} onChange={e => setThirtySTS(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 flex items-center mb-1">
                      TUG (segundos)
                    </label>
                    <input type="number" step="0.1" className={iCls} placeholder="ej: 9.2" value={tug} onChange={e => setTug(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Constantes Vitales</h4>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Sistólica</label>
                    <input type="number" className={iCls} placeholder="120" value={vitals.systolic} onChange={e => setVitals(v => ({ ...v, systolic: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Diastólica</label>
                    <input type="number" className={iCls} placeholder="80" value={vitals.diastolic} onChange={e => setVitals(v => ({ ...v, diastolic: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">FC (bpm)</label>
                    <input type="number" className={iCls} placeholder="72" value={vitals.heart_rate} onChange={e => setVitals(v => ({ ...v, heart_rate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">SpO₂ (%)</label>
                    <input type="number" className={iCls} placeholder="97" value={vitals.spo2} onChange={e => setVitals(v => ({ ...v, spo2: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Peso (kg)</label>
                    <input type="number" step="0.1" className={iCls} placeholder="68.5" value={vitals.weight} onChange={e => setVitals(v => ({ ...v, weight: e.target.value }))} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ASSESSMENT */}
            <TabsContent value="assessment" className="mt-0 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Etiquetas de Estado Clínico</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                        statusTags.includes(tag)
                          ? tag.includes('Toxicidad') || tag.includes('no controlado') || tag.includes('significativa')
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      )}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Notas Clínicas (Evaluación)</label>
                <Textarea className="min-h-[180px]" placeholder="Evaluación clínica estructurada..." value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} />
              </div>
              {statusTags.some(t => t.includes('Toxicidad') || t.includes('no controlado')) && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">Se han detectado indicadores de alerta. Considere generar una orden de crisis o interconsulta.</p>
                </div>
              )}
            </TabsContent>

            {/* PLAN */}
            <TabsContent value="plan" className="mt-0 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-2">Prescribir Programas Activos</label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {programs.map(prog => (
                    <button key={prog.code} onClick={() => toggleProgram(prog.code)}
                      className={cn('text-left text-xs p-2.5 rounded-lg border transition-colors',
                        prescribedPrograms.includes(prog.code)
                          ? 'bg-teal-50 border-teal-300 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      )}>
                      <span className="font-semibold">{prog.code}</span> – {prog.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Notas del Plan</label>
                <Textarea className="min-h-[80px]" placeholder="Indicaciones, frecuencia de seguimiento, recomendaciones..." value={planNotes} onChange={e => setPlanNotes(e.target.value)} />
              </div>
              {(encounterType === 'phase_transition' || triggerPhaseTransition) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={triggerPhaseTransition} onChange={e => setTriggerPhaseTransition(e.target.checked)} className="rounded" />
                    <span className="text-xs font-semibold text-purple-800">Progresión de Fase del Journey</span>
                  </label>
                  {triggerPhaseTransition && (
                    <div className="flex flex-wrap gap-1.5">
                      {PHASES.map(phase => (
                        <button key={phase} onClick={() => setNewPhase(phase)}
                          disabled={phase === currentPhase}
                          className={cn('text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                            newPhase === phase ? 'bg-purple-600 text-white border-purple-600'
                              : phase === currentPhase ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                          )}>
                          {phase} · {PHASE_LABELS[phase]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Duración estimada: <span className="font-semibold text-slate-600">{durationMin} min</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button onClick={() => handleSave('in_progress')}
              className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg hover:bg-teal-100">
              Guardar Borrador
            </button>
            <button onClick={() => handleSave('completed')}
              className="flex items-center gap-1.5 text-xs text-white bg-teal-600 px-4 py-2 rounded-lg hover:bg-teal-700">
              <Save size={14} /> Completar Visita
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
