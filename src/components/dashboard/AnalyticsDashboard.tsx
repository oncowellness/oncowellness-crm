import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart2, TrendingUp, TrendingDown, Users, AlertTriangle, Calendar, Activity } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { useSessions } from '@/hooks/useSessions'
import { useAlerts } from '@/hooks/useAlerts'
import { useAllCrisisOrders } from '@/hooks/useAllCrisisOrders'
import { cn } from '@/lib/utils'
import { PHASE_LABELS, type Phase } from '@/types'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

// Hooks for aggregated data
function useAllSessions() {
  return useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sessions').select('*').order('fecha', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

function useAllClinicalTests() {
  return useQuery({
    queryKey: ['all-clinical-tests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clinical_tests').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

function StatCard({ label, value, sub, trend, icon, color }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          )}>
            {trend === 'up' && <TrendingUp size={10} className="inline mr-1" />}
            {trend === 'down' && <TrendingDown size={10} className="inline mr-1" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {!trend && sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

const PERIOD_OPTIONS = [
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '12 meses', months: 12 },
]

const PIE_COLORS = ['hsl(160, 60%, 45%)', 'hsl(210, 60%, 55%)', 'hsl(45, 80%, 55%)', 'hsl(0, 60%, 55%)', 'hsl(280, 50%, 55%)']

export function AnalyticsDashboard() {
  const [periodMonths, setPeriodMonths] = useState(6)

  const { data: patients = [] } = usePatients()
  const { data: sessions = [] } = useAllSessions()
  const { data: alerts = [] } = useAlerts()
  const { data: crisisOrders = [] } = useAllCrisisOrders()
  const { data: clinicalTests = [] } = useAllClinicalTests()

  const now = new Date()
  const periodStart = subMonths(now, periodMonths)

  // Filter by period
  const periodSessions = useMemo(() =>
    (sessions ?? []).filter(s => {
      try { return parseISO(s.fecha) >= periodStart } catch { return false }
    }), [sessions, periodStart])

  const periodAlerts = useMemo(() =>
    (alerts ?? []).filter(a => {
      try { return parseISO(a.created_at) >= periodStart } catch { return false }
    }), [alerts, periodStart])

  const periodTests = useMemo(() =>
    (clinicalTests ?? []).filter(t => {
      try { return parseISO(t.created_at) >= periodStart } catch { return false }
    }), [clinicalTests, periodStart])

  // === KPIs ===
  const totalPatients = patients.length
  const activePatients = patients.filter(p => p.active_status).length
  const completedSessions = periodSessions.filter(s => s.status === 'realizada').length
  const totalSessions = periodSessions.length
  const adherenceRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : '0'
  const cancelledSessions = periodSessions.filter(s => s.status === 'cancelada').length
  const cancelRate = totalSessions > 0 ? ((cancelledSessions / totalSessions) * 100).toFixed(1) : '0'

  const unresolvedAlerts = periodAlerts.filter(a => !a.resolved).length
  const criticalAlerts = periodAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
  const pendingCrisis = (crisisOrders ?? []).filter((c: any) => c.status === 'pendiente').length

  // === Clinical improvement ===
  const improvementTests = useMemo(() => {
    const testTypes = ['Handgrip', '6MWT', '30STS'] as const
    const results: { type: string; avgImprovement: number; count: number }[] = []

    testTypes.forEach(tipo => {
      const testsOfType = (clinicalTests ?? []).filter(t => t.tipo === tipo)
      // Group by patient
      const byPatient = new Map<string, typeof testsOfType>()
      testsOfType.forEach(t => {
        const arr = byPatient.get(t.patient_id) ?? []
        arr.push(t)
        byPatient.set(t.patient_id, arr)
      })

      const improvements: number[] = []
      byPatient.forEach(tests => {
        const sorted = [...tests].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        const baseline = sorted.find(t => t.is_baseline) ?? sorted[0]
        const latest = sorted[sorted.length - 1]
        if (baseline && latest && baseline.id !== latest.id && baseline.valor_numerico && latest.valor_numerico && baseline.valor_numerico > 0) {
          const pct = ((latest.valor_numerico - baseline.valor_numerico) / baseline.valor_numerico) * 100
          improvements.push(pct)
        }
      })

      if (improvements.length > 0) {
        results.push({
          type: tipo,
          avgImprovement: improvements.reduce((a, b) => a + b, 0) / improvements.length,
          count: improvements.length,
        })
      }
    })

    // TUG (lower is better)
    const tugTests = (clinicalTests ?? []).filter(t => t.tipo === 'TUG')
    const tugByPatient = new Map<string, typeof tugTests>()
    tugTests.forEach(t => {
      const arr = tugByPatient.get(t.patient_id) ?? []
      arr.push(t)
      tugByPatient.set(t.patient_id, arr)
    })
    const tugImprovements: number[] = []
    tugByPatient.forEach(tests => {
      const sorted = [...tests].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const baseline = sorted.find(t => t.is_baseline) ?? sorted[0]
      const latest = sorted[sorted.length - 1]
      if (baseline && latest && baseline.id !== latest.id && baseline.valor_numerico && latest.valor_numerico && baseline.valor_numerico > 0) {
        const pct = ((baseline.valor_numerico - latest.valor_numerico) / baseline.valor_numerico) * 100
        tugImprovements.push(pct)
      }
    })
    if (tugImprovements.length > 0) {
      results.push({ type: 'TUG', avgImprovement: tugImprovements.reduce((a, b) => a + b, 0) / tugImprovements.length, count: tugImprovements.length })
    }

    return results
  }, [clinicalTests])

  // === Charts Data ===

  // Sessions by month
  const sessionsByMonth = useMemo(() => {
    const months: { month: string; realizadas: number; canceladas: number; pendientes: number }[] = []
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      const label = format(monthDate, 'MMM yy', { locale: es })
      const inMonth = periodSessions.filter(s => {
        try {
          const d = parseISO(s.fecha)
          return isWithinInterval(d, { start, end })
        } catch { return false }
      })
      months.push({
        month: label,
        realizadas: inMonth.filter(s => s.status === 'realizada').length,
        canceladas: inMonth.filter(s => s.status === 'cancelada').length,
        pendientes: inMonth.filter(s => s.status === 'pendiente' || s.status === 'confirmada').length,
      })
    }
    return months
  }, [periodSessions, periodMonths])

  // Alerts by month
  const alertsByMonth = useMemo(() => {
    const months: { month: string; total: number; critical: number; resolved: number }[] = []
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      const label = format(monthDate, 'MMM yy', { locale: es })
      const inMonth = periodAlerts.filter(a => {
        try {
          return isWithinInterval(parseISO(a.created_at), { start, end })
        } catch { return false }
      })
      months.push({
        month: label,
        total: inMonth.length,
        critical: inMonth.filter(a => a.severity === 'critical' || a.severity === 'high').length,
        resolved: inMonth.filter(a => a.resolved).length,
      })
    }
    return months
  }, [periodAlerts, periodMonths])

  // Patients by phase
  const patientsByPhase = useMemo(() => {
    const phaseCount = new Map<string, number>()
    patients.forEach(p => {
      phaseCount.set(p.fase_journey, (phaseCount.get(p.fase_journey) ?? 0) + 1)
    })
    return Array.from(phaseCount.entries()).map(([phase, count]) => ({
      name: `${phase} ${PHASE_LABELS[phase as Phase] ?? ''}`,
      value: count,
    }))
  }, [patients])

  // Tests by type
  const testsByType = useMemo(() => {
    const typeCount = new Map<string, number>()
    periodTests.forEach(t => {
      typeCount.set(t.tipo, (typeCount.get(t.tipo) ?? 0) + 1)
    })
    return Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, count]) => ({ tipo, count }))
  }, [periodTests])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Analítica Clínica</h1>
            <p className="text-xs text-muted-foreground">KPIs agregados · Adherencia · Mejora clínica · Alertas</p>
          </div>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.months}
              onClick={() => setPeriodMonths(opt.months)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
                periodMonths === opt.months
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pacientes Activos"
          value={`${activePatients}`}
          sub={`${totalPatients} totales`}
          icon={<Users size={18} className="text-teal-600" />}
          color="bg-teal-100"
        />
        <StatCard
          label="Tasa de Adherencia"
          value={`${adherenceRate}%`}
          sub={`${completedSessions}/${totalSessions} sesiones`}
          trend={Number(adherenceRate) >= 70 ? 'up' : Number(adherenceRate) < 50 ? 'down' : 'neutral'}
          icon={<Calendar size={18} className="text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          label="Alertas Activas"
          value={`${unresolvedAlerts}`}
          sub={`${criticalAlerts} críticas/altas`}
          trend={unresolvedAlerts === 0 ? 'up' : unresolvedAlerts > 5 ? 'down' : 'neutral'}
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          color="bg-amber-100"
        />
        <StatCard
          label="Crisis Pendientes"
          value={`${pendingCrisis}`}
          sub={`Tasa cancelación: ${cancelRate}%`}
          trend={pendingCrisis === 0 ? 'up' : 'down'}
          icon={<Activity size={18} className="text-red-600" />}
          color="bg-red-100"
        />
      </div>

      {/* Clinical Improvement */}
      {improvementTests.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Mejora Clínica Promedio (Basal → Último)</h3>
          <p className="text-xs text-muted-foreground mb-4">Porcentaje de mejora promedio por tipo de test</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {improvementTests.map(t => (
              <div key={t.type} className={cn(
                'rounded-lg border p-4 text-center',
                t.avgImprovement > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              )}>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t.type}</p>
                <p className={cn('text-xl font-bold', t.avgImprovement > 0 ? 'text-green-700' : 'text-red-700')}>
                  {t.avgImprovement > 0 ? '+' : ''}{t.avgImprovement.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{t.count} paciente{t.count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sessions by month */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Sesiones por Mes</h3>
          <p className="text-xs text-muted-foreground mb-4">Realizadas vs canceladas vs pendientes</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sessionsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="realizadas" fill="hsl(160, 60%, 45%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pendientes" fill="hsl(45, 80%, 55%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="canceladas" fill="hsl(0, 60%, 55%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts by month */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Alertas por Mes</h3>
          <p className="text-xs text-muted-foreground mb-4">Total, críticas/altas y resueltas</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={alertsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total" stroke="hsl(210, 60%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Total" />
              <Line type="monotone" dataKey="critical" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Críticas" />
              <Line type="monotone" dataKey="resolved" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Resueltas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patients by phase */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Pacientes por Fase</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribución del Patient Journey</p>
          {patientsByPhase.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={patientsByPhase} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine>
                  {patientsByPhase.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-12">Sin pacientes</p>
          )}
        </div>

        {/* Tests by type */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Tests Realizados por Tipo</h3>
          <p className="text-xs text-muted-foreground mb-4">Volumen de evaluaciones en el periodo</p>
          {testsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={testsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(260, 50%, 55%)" radius={[0, 4, 4, 0]} name="Tests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-12">Sin tests en el periodo</p>
          )}
        </div>
      </div>
    </div>
  )
}
