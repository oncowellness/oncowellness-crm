import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Stethoscope, Brain, ClipboardList, CalendarCheck, FileEdit, AlertTriangle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useEncounters, type EncounterRow } from '@/hooks/useEncounters'
import { PHASE_LABELS, type Phase } from '@/types'

interface Props {
  patientId: string
  onEditEncounter?: (encounter: EncounterRow) => void
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; cls: string }> = {
  initial: { label: 'Visita Inicial', emoji: '🏥', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  successive: { label: 'Visita Sucesiva', emoji: '🔄', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  phase_transition: { label: 'Transición de Fase', emoji: '📈', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  emergency: { label: 'Urgencia', emoji: '🚨', cls: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function EncounterTimeline({ patientId, onEditEncounter }: Props) {
  const { data: encounters = [], isLoading } = useEncounters(patientId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <div className="text-xs text-slate-400 py-4">Cargando historial...</div>
  if (encounters.length === 0) return <p className="text-xs text-slate-400 text-center py-6">Sin visitas registradas</p>

  return (
    <div className="space-y-3">
      {encounters.map((enc, idx) => {
        const isExpanded = expandedId === enc.id
        const typeCfg = TYPE_LABELS[enc.encounter_type] ?? TYPE_LABELS.successive
        const subj = enc.subjective as any
        const obj = enc.objective as any
        const assess = enc.assessment as any
        const planData = enc.plan as any

        return (
          <div key={enc.id} className="relative">
            {/* Timeline line */}
            {idx < encounters.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 w-px bg-slate-200" />
            )}

            <div className={cn('bg-white rounded-xl border transition-all', isExpanded ? 'border-teal-200 shadow-sm' : 'border-slate-200')}>
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : enc.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0', typeCfg.cls)}>
                  {typeCfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{typeCfg.label}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[enc.status])}>
                      {enc.status === 'completed' ? 'Completada' : enc.status === 'in_progress' ? 'En curso' : 'Cancelada'}
                    </span>
                    {enc.triggers_phase_transition && enc.new_phase && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        → {enc.new_phase} ({PHASE_LABELS[enc.new_phase as Phase] ?? ''})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(enc.created_at)} · {enc.staff_name ?? '—'} · {enc.duration_minutes} min · Fase {enc.phase_at_encounter}
                  </p>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>

              {/* Expanded SOAP Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                  {/* Subjective */}
                  {(subj?.chief_complaint || subj?.narrative || subj?.pain_scale != null) && (
                    <div>
                      <h5 className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 flex items-center gap-1 mb-1.5">
                        <Brain size={12} /> Subjetivo
                      </h5>
                      {subj.chief_complaint && <p className="text-xs text-slate-700 font-medium">{subj.chief_complaint}</p>}
                      <div className="flex gap-3 mt-1">
                        {subj.pain_scale != null && (
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            subj.pain_scale <= 3 ? 'bg-green-100 text-green-700' : subj.pain_scale <= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          )}>EVA: {subj.pain_scale}/10</span>
                        )}
                        {subj.fatigue_scale != null && (
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            subj.fatigue_scale <= 3 ? 'bg-green-100 text-green-700' : subj.fatigue_scale <= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          )}>Fatiga: {subj.fatigue_scale}/10</span>
                        )}
                      </div>
                      {subj.narrative && <p className="text-xs text-slate-500 mt-1 italic">"{subj.narrative}"</p>}
                    </div>
                  )}

                  {/* Objective */}
                  {(obj?.handgrip || obj?.six_mwt || obj?.thirty_sts || obj?.tug) && (
                    <div>
                      <h5 className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1 mb-1.5">
                        <Stethoscope size={12} /> Objetivo
                      </h5>
                      <div className="grid grid-cols-4 gap-2">
                        {obj.handgrip && <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-500">Handgrip</p><p className="text-sm font-bold text-slate-800">{obj.handgrip} kg</p></div>}
                        {obj.six_mwt && <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-500">6MWT</p><p className="text-sm font-bold text-slate-800">{obj.six_mwt} m</p></div>}
                        {obj.thirty_sts && <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-500">30STS</p><p className="text-sm font-bold text-slate-800">{obj.thirty_sts} reps</p></div>}
                        {obj.tug && <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-500">TUG</p><p className="text-sm font-bold text-slate-800">{obj.tug} s</p></div>}
                      </div>
                      {obj.vitals && (obj.vitals.systolic || obj.vitals.heart_rate) && (
                        <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                          {obj.vitals.systolic && <span>TA: {obj.vitals.systolic}/{obj.vitals.diastolic}</span>}
                          {obj.vitals.heart_rate && <span>FC: {obj.vitals.heart_rate} bpm</span>}
                          {obj.vitals.spo2 && <span>SpO₂: {obj.vitals.spo2}%</span>}
                          {obj.vitals.weight && <span>Peso: {obj.vitals.weight} kg</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assessment */}
                  {(assess?.notes || (assess?.status_tags && assess.status_tags.length > 0)) && (
                    <div>
                      <h5 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-1 mb-1.5">
                        <ClipboardList size={12} /> Evaluación
                      </h5>
                      {assess.status_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {assess.status_tags.map((tag: string) => (
                            <span key={tag} className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                              tag.includes('Toxicidad') || tag.includes('no controlado') || tag.includes('significativa')
                                ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                            )}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {assess.notes && <p className="text-xs text-slate-600">{assess.notes}</p>}
                    </div>
                  )}

                  {/* Plan */}
                  {(planData?.prescribed_programs?.length > 0 || planData?.notes) && (
                    <div>
                      <h5 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1 mb-1.5">
                        <CalendarCheck size={12} /> Plan
                      </h5>
                      {planData.prescribed_programs?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {planData.prescribed_programs.map((code: string) => (
                            <span key={code} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">{code}</span>
                          ))}
                        </div>
                      )}
                      {planData.notes && <p className="text-xs text-slate-600">{planData.notes}</p>}
                    </div>
                  )}

                  {/* Edit button */}
                  {enc.status !== 'completed' && onEditEncounter && (
                    <button onClick={() => onEditEncounter(enc)}
                      className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 mt-2">
                      <FileEdit size={13} /> Continuar editando
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
