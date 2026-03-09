import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'
import { TrendingUp, Users, Activity, BarChart2, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAllClinicalTests } from '@/hooks/useClinicalTests'
import { usePatients } from '@/hooks/usePatients'
import { useAllSessions } from '@/hooks/useSessions'
import { usePrograms } from '@/hooks/usePrograms'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const TEST_LABELS: Record<string, string> = {
  'Handgrip': 'Handgrip (kg)',
  '6MWT': '6MWT (m)',
  '30STS': '30STS (reps)',
  'TUG': 'TUG (s)',
  'PHQ-9': 'PHQ-9',
  'GAD-7': 'GAD-7',
  'FACIT-F': 'FACIT-F',
}

const TEST_COLORS: Record<string, string> = {
  'Handgrip': '#3b82f6',
  '6MWT': '#10b981',
  '30STS': '#8b5cf6',
  'TUG': '#f59e0b',
  'PHQ-9': '#ef4444',
  'GAD-7': '#f97316',
  'FACIT-F': '#06b6d4',
}

// For TUG and PHQ-9/GAD-7, lower is better
const LOWER_IS_BETTER = ['TUG', 'PHQ-9', 'GAD-7']

export function OutcomesDashboard() {
  const { data: allTests = [] } = useAllClinicalTests()
  const { data: patients = [] } = usePatients()
  const { data: sessions = [] } = useAllSessions()
  const { data: programs = [] } = usePrograms()
  const [selectedMetric, setSelectedMetric] = useState<string>('6MWT')

  // ── Population KPIs ──
  const populationStats = useMemo(() => {
    const activePatients = patients.filter(p => p.active_status)
    const totalPatients = activePatients.length
    const redAlert = activePatients.filter(p => p.alert_status === 'rojo').length
    const fallRisk = activePatients.filter(p => p.high_fall_risk).length

    // Phase distribution
    const phaseCount: Record<string, number> = {}
    activePatients.forEach(p => {
      phaseCount[p.fase_journey] = (phaseCount[p.fase_journey] || 0) + 1
    })

    return { totalPatients, redAlert, fallRisk, phaseCount }
  }, [patients])

  // ── Aggregate recovery curves ──
  const recoveryCurves = useMemo(() => {
    // Group tests by patient+type, compute % change from baseline over time
    const byPatientType = new Map<string, any[]>()
    for (const t of allTests) {
      const key = `${(t as any).patient_id}_${t.tipo}`
      if (!byPatientType.has(key)) byPatientType.set(key, [])
      byPatientType.get(key)!.push(t)
    }

    // For each metric, compute average % improvement at each measurement index
    const metricCurves: Record<string, { index: number; avgChange: number; count: number }[]> = {}

    for (const tipo of Object.keys(TEST_LABELS)) {
      const seriesByPatient: number[][] = []
      for (const [key, tests] of byPatientType) {
        if (!key.endsWith(`_${tipo}`)) continue
        const sorted = tests.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        if (sorted.length < 2 || sorted[0].valor_numerico == null) continue
        const baseline = sorted[0].valor_numerico
        if (baseline === 0) continue
        const changes = sorted.map((t: any) => ((t.valor_numerico - baseline) / Math.abs(baseline)) * 100)
        seriesByPatient.push(changes)
      }

      if (seriesByPatient.length === 0) continue
      const maxLen = Math.max(...seriesByPatient.map(s => s.length))
      const curve: { index: number; avgChange: number; count: number }[] = []
      for (let i = 0; i < maxLen && i < 10; i++) {
        const vals = seriesByPatient.filter(s => s[i] != null).map(s => s[i])
        if (vals.length === 0) continue
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length
        curve.push({ index: i, avgChange: Math.round(avg * 10) / 10, count: vals.length })
      }
      metricCurves[tipo] = curve
    }
    return metricCurves
  }, [allTests])

  // ── Program effectiveness ──
  const programEffectiveness = useMemo(() => {
    const sessionsByProgram = new Map<string, { total: number; completed: number }>()
    for (const s of sessions) {
      const code = (s as any).programa_code
      if (!sessionsByProgram.has(code)) sessionsByProgram.set(code, { total: 0, completed: 0 })
      const entry = sessionsByProgram.get(code)!
      entry.total++
      if ((s as any).status === 'realizada') entry.completed++
    }

    return Array.from(sessionsByProgram.entries())
      .map(([code, stats]) => {
        const program = programs.find(p => p.code === code)
        return {
          code,
          name: program?.nombre ?? code,
          tipo: program?.tipo ?? '?',
          total: stats.total,
          completed: stats.completed,
          rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [sessions, programs])

  // ── Improvement summary per metric ──
  const improvementSummary = useMemo(() => {
    const results: { metric: string; improved: number; total: number; avgChange: number }[] = []
    const byPatientType = new Map<string, any[]>()
    for (const t of allTests) {
      const key = `${(t as any).patient_id}_${t.tipo}`
      if (!byPatientType.has(key)) byPatientType.set(key, [])
      byPatientType.get(key)!.push(t)
    }

    for (const tipo of Object.keys(TEST_LABELS)) {
      let improved = 0, total = 0, sumChange = 0
      for (const [key, tests] of byPatientType) {
        if (!key.endsWith(`_${tipo}`)) continue
        const sorted = tests.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        if (sorted.length < 2 || sorted[0].valor_numerico == null) continue
        const baseline = sorted[0].valor_numerico
        const latest = sorted[sorted.length - 1].valor_numerico
        if (baseline === 0) continue
        const change = ((latest - baseline) / Math.abs(baseline)) * 100
        const isImproved = LOWER_IS_BETTER.includes(tipo) ? change < 0 : change > 0
        total++
        if (isImproved) improved++
        sumChange += change
      }
      if (total > 0) {
        results.push({ metric: tipo, improved, total, avgChange: Math.round((sumChange / total) * 10) / 10 })
      }
    }
    return results
  }, [allTests])

  // ── Radar data for program types ──
  const radarData = useMemo(() => {
    const typeMap: Record<string, { total: number; completed: number }> = {}
    for (const pe of programEffectiveness) {
      if (!typeMap[pe.tipo]) typeMap[pe.tipo] = { total: 0, completed: 0 }
      typeMap[pe.tipo].total += pe.total
      typeMap[pe.tipo].completed += pe.completed
    }
    const typeLabels: Record<string, string> = { FX: 'Fisioterapia', PS: 'Psicología', NU: 'Nutrición', EO: 'Empoderamiento', TS: 'Trabajo Social' }
    return Object.entries(typeMap).map(([tipo, stats]) => ({
      subject: typeLabels[tipo] ?? tipo,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      volume: stats.total,
    }))
  }, [programEffectiveness])

  const curveData = recoveryCurves[selectedMetric] ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
          <TrendingUp size={18} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Outcomes Poblacionales</h2>
          <p className="text-xs text-muted-foreground">Curvas de recuperación agregadas y efectividad por programa</p>
        </div>
      </div>

      {/* Population KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pacientes activos', value: populationStats.totalPatients, icon: <Users size={14} />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Alerta roja', value: populationStats.redAlert, icon: <Activity size={14} />, color: 'text-red-600 bg-red-100' },
          { label: 'Riesgo caída', value: populationStats.fallRisk, icon: <Target size={14} />, color: 'text-orange-600 bg-orange-100' },
          { label: 'Tests registrados', value: allTests.length, icon: <BarChart2 size={14} />, color: 'text-violet-600 bg-violet-100' },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', k.color)}>{k.icon}</div>
              <span className="text-[11px] text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Improvement summary cards */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Resumen de Mejora por Métrica</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {improvementSummary.map(m => {
            const isGood = LOWER_IS_BETTER.includes(m.metric) ? m.avgChange < 0 : m.avgChange > 0
            return (
              <div key={m.metric} className="p-3 rounded-lg border bg-muted/30">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">{m.metric}</p>
                <div className="flex items-center gap-1">
                  {isGood ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                  <span className={cn('text-sm font-bold', isGood ? 'text-green-600' : 'text-red-600')}>
                    {m.avgChange > 0 ? '+' : ''}{m.avgChange}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{m.improved}/{m.total} mejoraron</p>
              </div>
            )
          })}
          {improvementSummary.length === 0 && <p className="col-span-full text-xs text-muted-foreground text-center py-4">Sin datos suficientes (se necesitan ≥2 mediciones por paciente)</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recovery curves */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Curva de Recuperación Agregada</h3>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1 bg-background text-foreground"
            >
              {Object.keys(TEST_LABELS).map(t => (
                <option key={t} value={t}>{TEST_LABELS[t]}</option>
              ))}
            </select>
          </div>
          {curveData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: 'Medición #', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '% cambio vs basal', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => [`${v}%`, 'Cambio promedio']}
                  labelFormatter={(l) => `Medición #${l}`}
                />
                <Line type="monotone" dataKey="avgChange" stroke={TEST_COLORS[selectedMetric]} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-16">Datos insuficientes para {TEST_LABELS[selectedMetric]}</p>
          )}
          {curveData.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Basado en {curveData[0]?.count ?? 0} pacientes con ≥2 mediciones
            </p>
          )}
        </div>

        {/* Radar: program type effectiveness */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Efectividad por Tipo de Programa</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Radar name="Tasa completación %" dataKey="completionRate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-16">Sin datos de sesiones</p>
          )}
        </div>
      </div>

      {/* Program effectiveness table */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Efectividad por Programa</h3>
        {programEffectiveness.length > 0 ? (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={Math.max(200, programEffectiveness.length * 35 + 40)}>
              <BarChart data={programEffectiveness} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: '% Completación', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11 }} width={70} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number, _name: string, props: any) => [`${v}% (${props.payload.completed}/${props.payload.total})`, 'Completación']}
                />
                <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">Sin datos de programas</p>
        )}
      </div>

      {/* Phase distribution */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Distribución por Fase del Journey</h3>
        <div className="flex gap-2 flex-wrap">
          {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'].map(phase => {
            const count = populationStats.phaseCount[phase] ?? 0
            const pct = populationStats.totalPatients > 0 ? Math.round((count / populationStats.totalPatients) * 100) : 0
            return (
              <div key={phase} className="flex-1 min-w-[80px] p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-xs font-bold text-foreground">{phase}</p>
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground">{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
