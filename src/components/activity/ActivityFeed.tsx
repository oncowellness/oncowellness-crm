import { useMemo } from 'react'
import { AlertTriangle, Brain, Calendar, Clock, CheckCircle, XCircle, Bell } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { useAllCrisisOrders } from '@/hooks/useAllCrisisOrders'
import { useAllSessions } from '@/hooks/useSessions'
import { usePatients } from '@/hooks/usePatients'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

interface ActivityItem {
  id: string
  type: 'alert' | 'crisis' | 'session'
  icon: React.ReactNode
  title: string
  description: string
  timestamp: string
  severity?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-50/50',
  high: 'border-l-orange-500 bg-orange-50/30',
  medium: 'border-l-yellow-500 bg-yellow-50/30',
  low: 'border-l-slate-300',
}

export function ActivityFeed() {
  const { data: alerts = [] } = useAlerts()
  const { data: crisisOrders = [] } = useAllCrisisOrders()
  const { data: sessions = [] } = useAllSessions()
  const { data: patients = [] } = usePatients()

  const patientMap = useMemo(() => {
    const map = new Map<string, string>()
    patients.forEach(p => map.set(p.id, p.nombre))
    return map
  }, [patients])

  const items: ActivityItem[] = useMemo(() => {
    const all: ActivityItem[] = []

    // Alerts
    ;(alerts ?? []).slice(0, 15).forEach(a => {
      all.push({
        id: `alert-${a.id}`,
        type: 'alert',
        icon: <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-500' : a.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'} />,
        title: a.message ?? a.alert_type,
        description: patientMap.get(a.patient_id) ?? 'Paciente',
        timestamp: a.created_at,
        severity: a.severity,
      })
    })

    // Crisis orders
    ;(crisisOrders ?? []).slice(0, 10).forEach(c => {
      all.push({
        id: `crisis-${c.id}`,
        type: 'crisis',
        icon: <Brain size={14} className="text-red-600" />,
        title: c.trigger_reason,
        description: `${patientMap.get(c.patient_id) ?? 'Paciente'} · ${c.status}`,
        timestamp: c.created_at,
        severity: 'critical',
      })
    })

    // Recent sessions
    ;(sessions ?? []).slice(0, 10).forEach(s => {
      const statusIcon = s.status === 'realizada' 
        ? <CheckCircle size={14} className="text-green-500" />
        : s.status === 'cancelada'
        ? <XCircle size={14} className="text-red-400" />
        : <Calendar size={14} className="text-blue-500" />
      all.push({
        id: `session-${s.id}`,
        type: 'session',
        icon: statusIcon,
        title: `${s.programa_code} — ${s.status}`,
        description: `${(s as any).patients?.nombre ?? patientMap.get(s.patient_id) ?? ''} · ${s.therapist_name ?? ''}`,
        timestamp: s.updated_at ?? s.created_at,
      })
    })

    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)
  }, [alerts, crisisOrders, sessions, patientMap])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
          <Clock size={18} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Actividad Reciente</h2>
          <p className="text-xs text-slate-500">Alertas, sesiones y órdenes de crisis en tiempo real</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin actividad reciente"
          description="Cuando se creen alertas, sesiones o crisis aparecerán aquí en tiempo real."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 px-5 py-3.5 border-l-[3px] transition-colors hover:bg-slate-50',
                item.severity ? SEVERITY_STYLES[item.severity] ?? 'border-l-slate-200' : 'border-l-slate-200'
              )}
            >
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                {timeAgo(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
