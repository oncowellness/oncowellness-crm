import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, Brain, Plus, AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { PromsForm } from './PromsForm'
import {
  PSYCHO_INSTRUMENTS, PHYSIO_INSTRUMENTS, PROMS_INSTRUMENTS,
  getInstrument, computeScore, getSeverityBand, isRedFlag,
  type PromsInstrument,
} from '@/lib/promsDefinitions'
import { formatDate, cn } from '@/lib/utils'
import type { Database } from '@/integrations/supabase/types'

type ClinicalTest = Database['public']['Tables']['clinical_tests']['Row']

function DeltaBadge({ current, baseline, inverted }: { current: number; baseline: number; inverted?: boolean }) {
  let delta = current - baseline
  if (inverted) delta = -delta
  if (delta > 0) return <span className="text-xs text-emerald-600 flex items-center gap-0.5"><TrendingUp size={12} />+{Math.abs(current - baseline).toFixed(1)}</span>
  if (delta < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown size={12} />{(current - baseline).toFixed(1)}</span>
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus size={12} />0</span>
}

function InstrumentCard({ instrument, tests }: { instrument: PromsInstrument; tests: ClinicalTest[] }) {
  const filtered = tests.filter(t => t.tipo === instrument.key)
  const latest = filtered[filtered.length - 1]
  const baseline = filtered.find(t => t.is_baseline) || filtered[0]
  const score = latest?.valor_numerico ?? null
  const band = score != null ? getSeverityBand(instrument, score) : null
  const red = score != null ? isRedFlag(instrument, score) : false

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      red ? 'bg-red-50 border-red-300' : 'bg-card border-border'
    )}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground font-medium">{instrument.shortName}</p>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{instrument.subcategory}</span>
      </div>
      <p className={cn('text-2xl font-bold', red ? 'text-red-600' : 'text-foreground')}>
        {score != null ? `${score}` : 'N/D'}
        {score != null && <span className="text-xs font-normal text-muted-foreground ml-1">{instrument.unit}</span>}
      </p>
      {band && <p className={cn('text-xs font-semibold mt-0.5', band.textClass)}>{band.label}</p>}
      {baseline && latest && baseline !== latest && (
        <DeltaBadge current={score!} baseline={baseline.valor_numerico!} inverted={instrument.higherIsWorse} />
      )}
      {baseline && <p className="text-[10px] text-muted-foreground mt-0.5">Basal: {baseline.valor_numerico} {instrument.unit}</p>}
      <p className="text-[10px] text-muted-foreground">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

function InstrumentTrend({ instrument, tests }: { instrument: PromsInstrument; tests: ClinicalTest[] }) {
  const filtered = tests.filter(t => t.tipo === instrument.key)
  if (filtered.length < 2) return null

  const data = filtered.map(t => ({
    date: formatDate(t.created_at),
    value: t.valor_numerico ?? 0,
  }))

  const baseline = filtered.find(t => t.is_baseline) || filtered[0]
  const latest = filtered[filtered.length - 1]
  const change = baseline && latest && baseline.valor_numerico
    ? ((latest.valor_numerico! - baseline.valor_numerico) / baseline.valor_numerico * 100).toFixed(1)
    : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">
          Basal: <strong>{baseline?.valor_numerico} {instrument.unit}</strong>
        </span>
        <span className="text-xs text-muted-foreground">
          Último: <strong>{latest?.valor_numerico} {instrument.unit}</strong>
        </span>
        {change && (
          <span className={cn('text-xs font-semibold',
            instrument.higherIsWorse
              ? parseFloat(change) < 0 ? 'text-emerald-600' : 'text-red-600'
              : parseFloat(change) > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {parseFloat(change) > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} ${instrument.unit}`, instrument.shortName]} />
          {instrument.redFlagThreshold != null && (
            <ReferenceLine
              y={instrument.redFlagThreshold}
              stroke="#ef4444"
              strokeDasharray="6 3"
              label={{ value: '⚠ Umbral', fontSize: 9, fill: '#ef4444', position: 'right' }}
            />
          )}
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryPanel({ instruments, tests, patientId }: { instruments: PromsInstrument[]; tests: ClinicalTest[]; patientId: string }) {
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const [activeTrend, setActiveTrend] = useState<string | null>(null)

  // Group by subcategory
  const groups = useMemo(() => {
    const map = new Map<string, PromsInstrument[]>()
    instruments.forEach(inst => {
      const list = map.get(inst.subcategory) || []
      list.push(inst)
      map.set(inst.subcategory, list)
    })
    return Array.from(map.entries())
  }, [instruments])

  // Red flags
  const redFlags = useMemo(() => {
    return instruments.filter(inst => {
      const filtered = tests.filter(t => t.tipo === inst.key)
      const latest = filtered[filtered.length - 1]
      return latest && isRedFlag(inst, latest.valor_numerico ?? 0)
    })
  }, [instruments, tests])

  return (
    <div className="space-y-5">
      {/* Red flags banner */}
      {redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} /> {redFlags.length} Alerta{redFlags.length > 1 ? 's' : ''} Clínica{redFlags.length > 1 ? 's' : ''}
          </p>
          <div className="mt-2 space-y-1">
            {redFlags.map(inst => {
              const latest = tests.filter(t => t.tipo === inst.key).pop()
              const band = latest ? getSeverityBand(inst, latest.valor_numerico ?? 0) : null
              return (
                <p key={inst.key} className="text-xs text-red-600">
                  · {inst.shortName}: {latest?.valor_numerico} {inst.unit} — {band?.label} {inst.redFlagMessage ? `(${inst.redFlagMessage})` : ''}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI grid by subcategory */}
      {groups.map(([subcategory, insts]) => (
        <div key={subcategory}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{subcategory}</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
            {insts.map(inst => (
              <InstrumentCard key={inst.key} instrument={inst} tests={tests} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {insts.map(inst => (
              <div key={inst.key} className="flex gap-1">
                <button
                  onClick={() => setActiveForm(activeForm === inst.key ? null : inst.key)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1',
                    activeForm === inst.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-input hover:border-primary/50'
                  )}
                >
                  <Plus size={10} /> {inst.shortName}
                </button>
                {tests.filter(t => t.tipo === inst.key).length >= 2 && (
                  <button
                    onClick={() => setActiveTrend(activeTrend === inst.key ? null : inst.key)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg border transition-colors',
                      activeTrend === inst.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-input hover:border-primary/50'
                    )}
                  >
                    📈
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Active form */}
          {activeForm && insts.find(i => i.key === activeForm) && (
            <PromsForm
              instrument={insts.find(i => i.key === activeForm)!}
              patientId={patientId}
              onComplete={() => setActiveForm(null)}
            />
          )}
          {/* Active trend */}
          {activeTrend && insts.find(i => i.key === activeTrend) && (
            <Card className="mt-2">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Evolución {insts.find(i => i.key === activeTrend)!.shortName}</CardTitle>
              </CardHeader>
              <CardContent>
                <InstrumentTrend instrument={insts.find(i => i.key === activeTrend)!} tests={tests} />
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}

export function PromsDashboard() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)

  if (!patient) return <div className="p-6 text-muted-foreground">Selecciona un paciente</div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <Activity size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Cuestionarios Clínicos (PROMs)</h2>
          <p className="text-xs text-muted-foreground">Paciente: {patient.nombre}</p>
        </div>
      </div>

      <Tabs defaultValue="physio" className="space-y-4">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="physio" className="text-sm gap-1.5">
            <Activity size={14} /> Fisioterapia
          </TabsTrigger>
          <TabsTrigger value="psycho" className="text-sm gap-1.5">
            <Brain size={14} /> Psicooncología
          </TabsTrigger>
        </TabsList>

        <TabsContent value="physio">
          <CategoryPanel instruments={PHYSIO_INSTRUMENTS} tests={clinicalTests} patientId={patient.id} />
        </TabsContent>

        <TabsContent value="psycho">
          <CategoryPanel instruments={PSYCHO_INSTRUMENTS} tests={clinicalTests} patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
