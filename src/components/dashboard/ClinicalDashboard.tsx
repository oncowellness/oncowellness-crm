import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests } from '@/hooks/useClinicalTests'
import { formatDate, cn } from '../../lib/utils'
import { PHASE_LABELS, type Phase } from '../../types'

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && (
        <p className={cn('text-xs mt-1 flex items-center gap-1', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400')}>
          {trend === 'up' && <TrendingUp size={12} />}{trend === 'down' && <TrendingDown size={12} />}{sub}
        </p>
      )}
    </div>
  )
}

export function ClinicalDashboard() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const phq9Tests = clinicalTests.filter(t => t.tipo === 'PHQ-9')
  const gad7Tests = clinicalTests.filter(t => t.tipo === 'GAD-7')
  const facitfTests = clinicalTests.filter(t => t.tipo === 'FACIT-F')
  const eortcTests = clinicalTests.filter(t => t.tipo === 'EORTC')

  const latestPHQ9 = phq9Tests[phq9Tests.length - 1]
  const latestGAD7 = gad7Tests[gad7Tests.length - 1]
  const latestFACIT = facitfTests[facitfTests.length - 1]
  const baselineFACIT = facitfTests[0]

  const getVal = (t: any) => t?.valor_numerico ?? 0
  const facitDelta = latestFACIT && baselineFACIT && latestFACIT !== baselineFACIT ? getVal(latestFACIT) - getVal(baselineFACIT) : null

  const facitData = facitfTests.map(f => ({ date: formatDate(f.created_at), 'FACIT-F': getVal(f) }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center"><BarChart2 size={18} className="text-indigo-600" /></div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Dashboard Clínico – PROMs/PREMs</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.nombre} · {patient.fase_journey} – {PHASE_LABELS[patient.fase_journey as Phase]}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="FACIT-F (fatiga)" value={latestFACIT ? `${getVal(latestFACIT)}/52` : 'N/D'}
          sub={facitDelta !== null ? `${facitDelta > 0 ? '+' : ''}${facitDelta} vs basal` : undefined}
          trend={facitDelta !== null ? (facitDelta > 0 ? 'up' : 'down') : undefined} />
        <StatCard label="PHQ-9 (depresión)" value={latestPHQ9 ? `${getVal(latestPHQ9)}/27` : 'N/D'}
          trend={latestPHQ9 ? (getVal(latestPHQ9) < 5 ? 'up' : getVal(latestPHQ9) >= 10 ? 'down' : 'neutral') : undefined} />
        <StatCard label="GAD-7 (ansiedad)" value={latestGAD7 ? `${getVal(latestGAD7)}/21` : 'N/D'} />
        <StatCard label="Tests Clínicos" value={`${clinicalTests.length}`} sub="registros totales" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Evolución Fatiga (FACIT-F)</h3>
        <p className="text-xs text-slate-400 mb-4">Mayor puntuación = menor fatiga (0–52)</p>
        {facitData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={facitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 52]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="FACIT-F" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-slate-400 text-center py-8">Sin datos FACIT-F</p>}
      </div>
    </div>
  )
}
