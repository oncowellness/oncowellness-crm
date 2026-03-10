import * as React from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PHASE_LABELS, type Phase } from '@/types'

export type TriageLevel = 'red' | 'amber' | 'green'

interface ClinicalPathwayProgressProps {
  currentPhase: Phase
  triageLevel?: TriageLevel
  gdprConsented?: boolean
  pathwayType?: string
}

const TRIAGE_BADGE_COLORS: Record<TriageLevel, string> = {
  red: 'bg-red-100 text-red-700 hover:bg-red-100',
  amber: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  green: 'bg-green-100 text-green-700 hover:bg-green-100',
}

const STEPS: { id: Phase; label: string; description: string }[] = [
  { id: 'F1', label: 'Diagnóstico', description: 'Evaluación inicial' },
  { id: 'F2', label: 'Prehab', description: 'Preparación al tratamiento' },
  { id: 'F3', label: 'Tratamiento', description: 'Tratamiento activo' },
  { id: 'F4', label: 'Tto. Avanzado', description: 'Tratamiento avanzado' },
  { id: 'F5', label: 'Evaluación', description: 'Re-evaluación clínica' },
  { id: 'F6', label: 'Supervivencia', description: 'Plan de supervivencia' },
  { id: 'F7', label: 'Seguimiento', description: 'Monitorización continua' },
  { id: 'F8', label: 'Cuid. Avanzados', description: 'Cuidados paliativos' },
]

export function ClinicalPathwayProgress({
  currentPhase,
  triageLevel,
  gdprConsented = true,
  pathwayType,
}: ClinicalPathwayProgressProps) {
  const currentStepIndex = React.useMemo(
    () => STEPS.findIndex(s => s.id === currentPhase),
    [currentPhase]
  )

  return (
    <Card className="w-full border-l-4 border-l-teal-600">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-bold text-slate-800">
            Ciclo Clínico — Patient Journey (MSK)
          </CardTitle>
          <div className="flex items-center gap-2">
            {triageLevel && (
              <Badge className={cn('text-[10px] h-5', TRIAGE_BADGE_COLORS[triageLevel])}>
                Triage: {triageLevel.toUpperCase()}
              </Badge>
            )}
            {pathwayType && (
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] h-5">
                {pathwayType}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop: horizontal stepper */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between w-full mt-2">
            {/* Background track */}
            <div className="absolute left-0 top-5 w-full h-0.5 bg-slate-200" />
            {/* Filled track */}
            <div
              className="absolute left-0 top-5 h-0.5 bg-teal-500 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.id} className="relative flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-white z-10',
                      isCompleted
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : isCurrent
                          ? 'border-teal-600 text-teal-600'
                          : 'border-slate-200 text-slate-300'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} />
                    ) : isCurrent ? (
                      <Clock size={18} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold mt-1.5 text-center leading-tight',
                      isCurrent ? 'text-teal-700' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                    )}
                  >
                    {step.id}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] text-center leading-tight',
                      isCurrent ? 'text-teal-600' : 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </span>

                  {/* GDPR warning on F1 */}
                  {step.id === 'F1' && isCurrent && !gdprConsented && (
                    <span className="flex items-center gap-0.5 text-[9px] text-red-500 mt-0.5 font-medium">
                      <AlertCircle size={9} /> GDPR
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: compact list */}
        <div className="md:hidden space-y-1 mt-2">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            if (!isCompleted && !isCurrent) return null
            return (
              <div key={step.id} className={cn('flex items-center gap-2 px-2 py-1 rounded-lg', isCurrent && 'bg-teal-50')}>
                {isCompleted ? (
                  <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                ) : (
                  <Clock size={14} className="text-teal-600 shrink-0" />
                )}
                <span className={cn('text-xs', isCurrent ? 'font-semibold text-teal-700' : 'text-slate-500')}>
                  {step.id} — {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
