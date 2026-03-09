import { useClinicalEvents } from '@/hooks/useClinicalEvents'
import { PHASE_LABELS, type Phase } from '@/types'
import { ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PhaseHistoryProps {
  patientId: string
}

export function PhaseHistory({ patientId }: PhaseHistoryProps) {
  const { data: events = [], isLoading } = useClinicalEvents(patientId)
  const phaseEvents = events.filter(e => e.event_type === 'phase_transition')

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock size={14} className="text-teal-600" />
          Historial de Transiciones de Fase
        </CardTitle>
      </CardHeader>
      <CardContent>
        {phaseEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Sin transiciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {phaseEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 border-l-2 border-teal-200 pl-3 py-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {ev.previous_phase}
                    </span>
                    <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                    <span className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {ev.new_phase}
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {PHASE_LABELS[ev.new_phase as Phase] ?? ''}
                    </span>
                  </div>
                  {ev.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">"{ev.reason}"</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ev.performed_by_name ?? 'Sistema'} · {new Date(ev.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
