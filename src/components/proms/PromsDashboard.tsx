import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronRight, BarChart3, FileText, ClipboardList } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { PromsForm } from './PromsForm'
import {
  PSYCHO_INSTRUMENTS, PHYSIO_INSTRUMENTS,
  getSeverityBand, isRedFlag,
  type PromsInstrument,
} from '@/lib/promsDefinitions'
import { formatDate, cn } from '@/lib/utils'
import type { Database } from '@/integrations/supabase/types'

type ClinicalTest = Database['public']['Tables']['clinical_tests']['Row']

/* ─── Delta Badge ─────────────────────────────────────────────────────────── */
function DeltaBadge({ current, baseline, inverted }: { current: number; baseline: number; inverted?: boolean }) {
  let delta = current - baseline
  if (inverted) delta = -delta
  const raw = current - baseline
  if (delta > 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full"><TrendingUp size={11} />+{Math.abs(raw).toFixed(1)}</span>
  if (delta < 0) return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-destructive bg-red-50 px-1.5 py-0.5 rounded-full"><TrendingDown size={11} />{raw.toFixed(1)}</span>
  return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"><Minus size={11} />0</span>
}

/* ─── Instrument KPI Card ─────────────────────────────────────────────────── */
function InstrumentCard({
  instrument, tests, isSelected, onSelect,
}: {
  instrument: PromsInstrument; tests: ClinicalTest[]; isSelected: boolean; onSelect: () => void
}) {
  const filtered = tests.filter(t => t.tipo === instrument.key)
  const latest = filtered[filtered.length - 1]
  const baseline = filtered.find(t => t.is_baseline) || filtered[0]
  const score = latest?.valor_numerico ?? null
  const band = score != null ? getSeverityBand(instrument, score) : null
  const red = score != null ? isRedFlag(instrument, score) : false

  return (
    <button
      onClick={onSelect}
      className={cn(
        'text-left w-full rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md group',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : red
            ? 'border-destructive/40 bg-destructive/5 hover:border-destructive/60'
            : 'border-border bg-card hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{instrument.shortName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{instrument.subcategory}</p>
        </div>
        <ChevronRight size={14} className={cn(
          'text-muted-foreground transition-transform mt-0.5',
          isSelected && 'text-primary rotate-90'
        )} />
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className={cn(
            'text-2xl font-bold tabular-nums',
            red ? 'text-destructive' : score != null ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {score != null ? score : '—'}
          </p>
          {score != null && <p className="text-[10px] text-muted-foreground">{instrument.unit}</p>}
        </div>
        <div className="text-right space-y-1">
          {band && (
            <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full', band.bgClass, band.textClass)}>
              {band.label}
            </span>
          )}
          {baseline && latest && baseline !== latest && (
            <div className="flex justify-end">
              <DeltaBadge current={score!} baseline={baseline.valor_numerico!} inverted={instrument.higherIsWorse} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
        {baseline && (
          <span className="text-[10px] text-muted-foreground">
            Basal: <strong>{baseline.valor_numerico}</strong>
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>
    </button>
  )
}

/* ─── Trend Chart ─────────────────────────────────────────────────────────── */
function InstrumentTrend({ instrument, tests }: { instrument: PromsInstrument; tests: ClinicalTest[] }) {
  const filtered = tests.filter(t => t.tipo === instrument.key)
  if (filtered.length < 2) return (
    <div className="text-center py-8">
      <BarChart3 size={32} className="mx-auto text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">Se necesitan al menos 2 registros para ver la evolución</p>
    </div>
  )

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span className="text-xs text-muted-foreground">Basal: <strong className="text-foreground">{baseline?.valor_numerico} {instrument.unit}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Último: <strong className="text-foreground">{latest?.valor_numerico} {instrument.unit}</strong></span>
        </div>
        {change && (
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
            instrument.higherIsWorse
              ? parseFloat(change) < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              : parseFloat(change) > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          )}>
            {parseFloat(change) > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            formatter={(v: number) => [`${v} ${instrument.unit}`, instrument.shortName]}
          />
          {instrument.redFlagThreshold != null && (
            <ReferenceLine
              y={instrument.redFlagThreshold}
              stroke="hsl(var(--destructive))"
              strokeDasharray="6 3"
              label={{ value: '⚠ Umbral', fontSize: 10, fill: 'hsl(var(--destructive))', position: 'right' }}
            />
          )}
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Detail Panel (shown when a card is selected) ────────────────────────── */
function InstrumentDetailPanel({ instrument, tests, patientId, onClose }: {
  instrument: PromsInstrument; tests: ClinicalTest[]; patientId: string; onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'form' | 'trend'>('form')

  return (
    <Card className="border-2 border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{instrument.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{instrument.description}</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            Cerrar ✕
          </button>
        </div>
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => setActiveTab('form')}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
              activeTab === 'form'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <FileText size={12} /> Nuevo registro
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
              activeTab === 'trend'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <BarChart3 size={12} /> Evolución
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'form' && (
          <PromsForm instrument={instrument} patientId={patientId} onComplete={onClose} />
        )}
        {activeTab === 'trend' && (
          <InstrumentTrend instrument={instrument} tests={tests} />
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Red Flags Banner ────────────────────────────────────────────────────── */
function RedFlagsBanner({ instruments, tests }: { instruments: PromsInstrument[]; tests: ClinicalTest[] }) {
  const redFlags = useMemo(() => {
    return instruments.filter(inst => {
      const filtered = tests.filter(t => t.tipo === inst.key)
      const latest = filtered[filtered.length - 1]
      return latest && isRedFlag(inst, latest.valor_numerico ?? 0)
    })
  }, [instruments, tests])

  if (redFlags.length === 0) return null

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertTriangle size={15} className="text-destructive" />
        </div>
        <p className="text-sm font-bold text-destructive">
          {redFlags.length} Alerta{redFlags.length > 1 ? 's' : ''} Clínica{redFlags.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-1.5 ml-9">
        {redFlags.map(inst => {
          const latest = tests.filter(t => t.tipo === inst.key).pop()
          const band = latest ? getSeverityBand(inst, latest.valor_numerico ?? 0) : null
          return (
            <p key={inst.key} className="text-xs text-destructive/80">
              <strong>{inst.shortName}:</strong> {latest?.valor_numerico} {inst.unit} — {band?.label}
              {inst.redFlagMessage && <span className="text-destructive font-medium"> · {inst.redFlagMessage}</span>}
            </p>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Category Panel ──────────────────────────────────────────────────────── */
function CategoryPanel({ instruments, tests, patientId }: {
  instruments: PromsInstrument[]; tests: ClinicalTest[]; patientId: string
}) {
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)

  const groups = useMemo(() => {
    const map = new Map<string, PromsInstrument[]>()
    instruments.forEach(inst => {
      const list = map.get(inst.subcategory) || []
      list.push(inst)
      map.set(inst.subcategory, list)
    })
    return Array.from(map.entries())
  }, [instruments])

  const selected = instruments.find(i => i.key === selectedInstrument)

  return (
    <div className="space-y-6">
      <RedFlagsBanner instruments={instruments} tests={tests} />

      {groups.map(([subcategory, insts]) => (
        <div key={subcategory} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{subcategory}</h4>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {insts.map(inst => (
              <InstrumentCard
                key={inst.key}
                instrument={inst}
                tests={tests}
                isSelected={selectedInstrument === inst.key}
                onSelect={() => setSelectedInstrument(
                  selectedInstrument === inst.key ? null : inst.key
                )}
              />
            ))}
          </div>

          {/* Detail panel appears inline below its group */}
          {selected && insts.find(i => i.key === selectedInstrument) && (
            <InstrumentDetailPanel
              instrument={selected}
              tests={tests}
              patientId={patientId}
              onClose={() => setSelectedInstrument(null)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Main Dashboard ──────────────────────────────────────────────────────── */
export function PromsDashboard() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)

  if (!patient) return (
    <EmptyState
      icon={ClipboardList}
      title="Cuestionarios Clínicos (PROMs)"
      description="Selecciona un paciente desde el listado para ver y registrar sus cuestionarios clínicos."
    />
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
          <ClipboardList size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Cuestionarios Clínicos</h2>
          <p className="text-sm text-muted-foreground">
            Paciente: <strong>{patient.nombre}</strong> · Evalúa, registra y compara resultados
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="physio" className="space-y-5">
        <TabsList className="h-11 p-1 bg-muted/60">
          <TabsTrigger value="physio" className="text-sm gap-2 px-5 data-[state=active]:shadow-sm">
            <Activity size={15} /> Fisioterapia
          </TabsTrigger>
          <TabsTrigger value="psycho" className="text-sm gap-2 px-5 data-[state=active]:shadow-sm">
            <Brain size={15} /> Psicooncología
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
