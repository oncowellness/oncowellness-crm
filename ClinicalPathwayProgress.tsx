import * as React from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export type PathwayPhase = 'intake' | 'pre_visit' | 'active_care' | 'survivorship'
export type TriageLevel = 'red' | 'amber' | 'green'

interface ClinicalPathwayProgressProps {
  currentPhase: PathwayPhase
  triageLevel?: TriageLevel
  gdprConsented: boolean
  pathwayType?: string
}

const TRIAGE_BADGE_COLORS: Record<TriageLevel, string> = {
  red: 'bg-red-100 text-red-700 hover:bg-red-100',
  amber: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  green: 'bg-green-100 text-green-700 hover:bg-green-100',
}

const STEPS: { id: PathwayPhase; label: string; description: string }[] = [
  { id: 'intake', label: 'Intake & Triage', description: 'Clasificación y Agenda' },
  { id: 'pre_visit', label: 'Pre-Visit Data', description: 'GDPR, PROs, Anamnesis' },
  { id: 'active_care', label: 'Clinical Pathway', description: 'Tratamiento Activo' },
  { id: 'survivorship', label: 'Survivorship', description: 'Seguimiento a largo plazo' }
]

export function ClinicalPathwayProgress({ 
  currentPhase, 
  triageLevel, 
  gdprConsented,
  pathwayType 
}: ClinicalPathwayProgressProps) {

  const currentStepIndex = React.useMemo(
    () => STEPS.findIndex(s => s.id === currentPhase),
    [currentPhase]
  )

  return (
    <Card className="w-full mb-6 border-l-4 border-l-blue-600">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-slate-800">
            Ciclo Clínico del Paciente
          </CardTitle>
          {pathwayType && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Pathway: {pathwayType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative flex items-center justify-between w-full mt-4">
          {/* Progress Bar Background */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />
          
          {/* Progress Bar Fill */}
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            
            return (
              <div key={step.id} className="flex flex-col items-center bg-white px-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                  isCurrent ? "bg-white border-blue-600 text-blue-600" :
                  "bg-slate-50 border-slate-200 text-slate-300"
                )}>
                  {isCompleted ? <CheckCircle2 size={20} /> : 
                   isCurrent ? <Clock size={20} /> : 
                   <Circle size={20} />}
                </div>
                <span className={cn(
                  "text-xs font-semibold mt-2",
                  isCurrent ? "text-blue-700" : "text-slate-500"
                )}>{step.label}</span>
                
                {/* Specific Status Indicators */}
                {step.id === 'intake' && triageLevel && isCurrent && (
                  <Badge className={cn("mt-1 text-[10px] h-4", TRIAGE_BADGE_COLORS[triageLevel])}>
                    {triageLevel.toUpperCase()}
                  </Badge>
                )}
                
                {step.id === 'pre_visit' && isCurrent && !gdprConsented && (
                  <span className="flex items-center gap-1 text-[10px] text-red-500 mt-1 font-medium">
                    <AlertCircle size={10} /> Falta GDPR
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}