import { CheckCircle, Circle, Clock } from 'lucide-react'
import type { Patient, Phase } from '../../types'
import { PHASE_LABELS } from '../../types'
import { cn } from '../../lib/utils'

const PHASES: Phase[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  F1: 'Evaluación multidisciplinar, valoración basal y plan de atención',
  F2: 'Preparación física y psicológica preoperatoria / pre-tratamiento',
  F3: 'Soporte activo durante quimioterapia, radioterapia o cirugía',
  F4: 'Manejo de toxicidades y enfermedad avanzada en tratamiento',
  F5: 'Evaluación de respuesta al tratamiento',
  F6: 'Programa de mantenimiento para supervivientes',
  F7: 'Seguimiento a largo plazo y detección precoz de recidivas',
  F8: 'Cuidados paliativos y acompañamiento en fase avanzada',
}

const PHASE_COLORS: Record<Phase, { bg: string; text: string; ring: string; line: string }> = {
  F1: { bg: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-200', line: 'bg-blue-300' },
  F2: { bg: 'bg-cyan-500', text: 'text-cyan-700', ring: 'ring-cyan-200', line: 'bg-cyan-300' },
  F3: { bg: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-200', line: 'bg-orange-300' },
  F4: { bg: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-200', line: 'bg-red-300' },
  F5: { bg: 'bg-purple-500', text: 'text-purple-700', ring: 'ring-purple-200', line: 'bg-purple-300' },
  F6: { bg: 'bg-green-500', text: 'text-green-700', ring: 'ring-green-200', line: 'bg-green-300' },
  F7: { bg: 'bg-teal-500', text: 'text-teal-700', ring: 'ring-teal-200', line: 'bg-teal-300' },
  F8: { bg: 'bg-slate-500', text: 'text-slate-700', ring: 'ring-slate-200', line: 'bg-slate-300' },
}

interface Props {
  patient: Patient
}

export function JourneyTimeline({ patient }: Props) {
  const currentIndex = PHASES.indexOf(patient.currentPhase)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">Journey del Paciente (F1–F8)</h3>

      {/* Horizontal timeline */}
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200" />
        {/* Progress line filled */}
        <div
          className="absolute top-5 left-5 h-0.5 bg-teal-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (PHASES.length - 1)) * 100}%` }}
        />

        {/* Phase nodes */}
        <div className="relative flex justify-between">
          {PHASES.map((phase, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex
            const colors = PHASE_COLORS[phase]

            return (
              <div key={phase} className="flex flex-col items-center gap-2" style={{ width: '12.5%' }}>
                {/* Node */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center z-10 ring-4',
                    isCompleted && `${colors.bg} ring-white`,
                    isCurrent && `${colors.bg} ring-4 ${colors.ring} shadow-lg scale-110`,
                    isFuture && 'bg-white border-2 border-slate-200 ring-white'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={18} className="text-white" />
                  ) : isCurrent ? (
                    <span className="text-white text-xs font-bold">{phase}</span>
                  ) : (
                    <Circle size={16} className="text-slate-300" />
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className={cn(
                    'text-xs font-semibold',
                    isCurrent ? colors.text : isCompleted ? 'text-slate-500' : 'text-slate-300'
                  )}>
                    {phase}
                  </p>
                  <p className={cn(
                    'text-[10px] leading-tight text-center hidden lg:block',
                    isCurrent ? 'text-slate-600' : 'text-slate-400'
                  )}>
                    {PHASE_LABELS[phase]}
                  </p>
                </div>

                {/* Current indicator */}
                {isCurrent && (
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-teal-600" />
                    <span className="text-[10px] text-teal-600 font-medium">Actual</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current phase detail */}
      <div className={cn(
        'mt-5 p-3 rounded-lg border-l-4',
        `border-l-${PHASE_COLORS[patient.currentPhase].bg.replace('bg-', '')}`,
        'bg-slate-50'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Fase actual: {patient.currentPhase} – {PHASE_LABELS[patient.currentPhase]}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{PHASE_DESCRIPTIONS[patient.currentPhase]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Estado mental</p>
            <p className="text-sm font-semibold text-slate-700">{patient.mindState}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
