import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, Plus, X } from 'lucide-react'
import { useClinicalTests, useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const fmt = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

interface FacitFWidgetProps {
  patientId: string
}

export function FacitFWidget({ patientId }: FacitFWidgetProps) {
  const { data: clinicalTests = [] } = useClinicalTests(patientId)
  const createTest = useCreateClinicalTest()
  const [showForm, setShowForm] = useState(false)
  const [score, setScore] = useState('')
  const [isBaseline, setIsBaseline] = useState(false)
  const [notes, setNotes] = useState('')

  const facitTests = useMemo(() =>
    clinicalTests
      .filter(t => t.tipo === 'FACIT-F')
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [clinicalTests]
  )

  const chartData = useMemo(() =>
    facitTests.map(t => ({
      date: fmt(t.created_at),
      value: t.valor_numerico ?? 0,
      isBaseline: t.is_baseline,
    })),
    [facitTests]
  )

  const baseline = facitTests.find(t => t.is_baseline)
  const latest = facitTests[facitTests.length - 1]
  const delta = baseline && latest && latest.id !== baseline.id
    ? (latest.valor_numerico ?? 0) - (baseline.valor_numerico ?? 0)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(score)
    if (isNaN(val) || val < 0 || val > 52) {
      toast.error('Puntuación válida: 0–52')
      return
    }
    try {
      await createTest.mutateAsync({
        patient_id: patientId,
        tipo: 'FACIT-F',
        valor_numerico: val,
        is_baseline: isBaseline,
        notas: notes || null,
      })
      toast.success('FACIT-F registrado')
      setShowForm(false)
      setScore('')
      setIsBaseline(false)
      setNotes('')
    } catch {
      toast.error('Error al registrar')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Evolución FACIT-F (Fatiga)</h3>
            <p className="text-[10px] text-slate-400">Mayor puntuación = menor fatiga (0–52)</p>
          </div>
        </div>
        <Button
          variant={showForm ? 'outline' : 'default'}
          size="sm"
          className="text-xs gap-1"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Registrar'}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Basal</p>
          <p className="text-lg font-bold text-slate-700">
            {baseline ? `${baseline.valor_numerico}/52` : 'N/D'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Último</p>
          <p className="text-lg font-bold text-emerald-600">
            {latest ? `${latest.valor_numerico}/52` : 'N/D'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Δ vs Basal</p>
          <p className={cn('text-lg font-bold', delta !== null ? (delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-500') : 'text-slate-400')}>
            {delta !== null ? `${delta > 0 ? '+' : ''}${delta}` : 'N/D'}
          </p>
        </div>
      </div>

      {/* Registration form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Puntuación (0–52)</label>
              <Input
                type="number"
                min={0}
                max={52}
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="0–52"
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Notas (opcional)</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones..."
                className="text-xs h-9"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isBaseline}
                onChange={e => setIsBaseline(e.target.checked)}
                className="rounded border-slate-300"
              />
              Marcar como basal
            </label>
            <Button type="submit" size="sm" className="text-xs" disabled={createTest.isPending}>
              {createTest.isPending ? 'Guardando…' : 'Guardar FACIT-F'}
            </Button>
          </div>
        </form>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis domain={[0, 52]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(v: number) => [`${v}/52`, 'FACIT-F']}
              labelFormatter={(l) => `Fecha: ${l}`}
            />
            <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: 'Fatiga significativa', fontSize: 9, fill: '#f59e0b', position: 'right' }} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3.5 }} activeDot={{ r: 5 }} name="FACIT-F" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-slate-400 text-center py-8">Sin datos FACIT-F. Usa "Registrar" para añadir la primera medición.</p>
      )}
    </div>
  )
}
