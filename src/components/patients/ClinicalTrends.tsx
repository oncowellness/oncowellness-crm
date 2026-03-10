import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Database } from '@/integrations/supabase/types'

type ClinicalTest = Database['public']['Tables']['clinical_tests']['Row']

interface ClinicalTrendsProps {
  tests: ClinicalTest[]
}

const fmt = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

function buildSeries(tests: ClinicalTest[], tipo: string) {
  return tests
    .filter(t => t.tipo === tipo)
    .map(t => ({
      date: fmt(t.created_at),
      value: t.valor_numerico ?? 0,
      isBaseline: t.is_baseline,
    }))
}

const CHARTS: { key: string; label: string; unit: string; color: string; threshold?: { value: number; label: string; color: string; direction: 'above' | 'below' } }[] = [
  { key: 'Handgrip', label: 'Handgrip', unit: 'kg', color: '#0d9488' },
  { key: '6MWT', label: '6MWT', unit: 'm', color: '#3b82f6' },
  { key: '30STS', label: '30STS', unit: 'reps', color: '#8b5cf6' },
  { key: 'TUG', label: 'TUG', unit: 's', color: '#f59e0b', threshold: { value: 12, label: 'Riesgo caída', color: '#ef4444', direction: 'above' } },
  { key: 'PHQ-9', label: 'PHQ-9', unit: 'pts', color: '#ec4899', threshold: { value: 10, label: 'Riesgo emocional', color: '#ef4444', direction: 'above' } },
  { key: 'GAD-7', label: 'GAD-7', unit: 'pts', color: '#f43f5e' },
  { key: 'FACIT-F', label: 'FACIT-F', unit: 'pts', color: '#10b981' },
]

export function ClinicalTrends({ tests }: ClinicalTrendsProps) {
  const seriesMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildSeries>> = {}
    CHARTS.forEach(c => { map[c.key] = buildSeries(tests, c.key) })
    return map
  }, [tests])

  const availableCharts = CHARTS.filter(c => seriesMap[c.key].length >= 2)

  if (availableCharts.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Evolución Clínica</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-6">
            Se necesitan al menos 2 mediciones de un mismo test para mostrar la curva de tendencia.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">📈 Evolución Clínica — Curvas de Tendencia</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableCharts[0].key} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {availableCharts.map(c => (
              <TabsTrigger key={c.key} value={c.key} className="text-xs">{c.label}</TabsTrigger>
            ))}
          </TabsList>

          {availableCharts.map(chart => {
            const data = seriesMap[chart.key]
            const baseline = data.find(d => d.isBaseline)
            const latest = data[data.length - 1]
            const change = baseline && latest && baseline.value !== 0
              ? ((latest.value - baseline.value) / baseline.value * 100).toFixed(1)
              : null

            return (
              <TabsContent key={chart.key} value={chart.key}>
                <div className="flex items-center gap-4 mb-3">
                  {baseline && (
                    <span className="text-xs text-muted-foreground">
                      Basal: <strong>{baseline.value} {chart.unit}</strong>
                    </span>
                  )}
                  {latest && (
                    <span className="text-xs text-muted-foreground">
                      Último: <strong>{latest.value} {chart.unit}</strong>
                    </span>
                  )}
                  {change && (
                    <span className={`text-xs font-semibold ${
                      chart.key === 'TUG' || chart.key === 'PHQ-9' || chart.key === 'GAD-7'
                        ? parseFloat(change) < 0 ? 'text-emerald-600' : 'text-red-600'
                        : parseFloat(change) > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {parseFloat(change) > 0 ? '+' : ''}{change}%
                    </span>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit={` ${chart.unit}`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                      formatter={(v: number) => [`${v} ${chart.unit}`, chart.label]}
                    />
                    {chart.threshold && (
                      <ReferenceLine
                        y={chart.threshold.value}
                        stroke={chart.threshold.color}
                        strokeDasharray="6 3"
                        label={{ value: chart.threshold.label, fontSize: 10, fill: chart.threshold.color, position: 'right' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chart.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: chart.color }}
                      activeDot={{ r: 6 }}
                      name={chart.label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
