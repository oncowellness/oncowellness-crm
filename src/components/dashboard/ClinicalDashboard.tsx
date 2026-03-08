import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDate, cn } from '../../lib/utils'
import { PHASE_LABELS } from '../../types'
import type { Patient } from '../../types'

interface Props {
  patient?: Patient
}

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && (
        <p className={cn(
          'text-xs mt-1 flex items-center gap-1',
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
        )}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {sub}
        </p>
      )}
    </div>
  )
}

export function ClinicalDashboard({ patient: propPatient }: Props) {
  const { patients, selectedPatientId } = useStore()
  const patient = propPatient ?? patients.find(p => p.id === selectedPatientId) ?? patients[0]

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  // FACIT-F evolution chart
  const facitData = patient.facitf.map(f => ({
    date: formatDate(f.date),
    'FACIT-F': f.totalScore,
  }))

  // EORTC radar data (latest)
  const latestEORTC = patient.eortc[patient.eortc.length - 1]
  const baselineEORTC = patient.eortc[0]
  const eortcRadarData = latestEORTC ? [
    { subject: 'Salud Global', actual: latestEORTC.globalHealth, basal: baselineEORTC?.globalHealth ?? 0 },
    { subject: 'Func. Física', actual: latestEORTC.physicalFunction, basal: baselineEORTC?.physicalFunction ?? 0 },
    { subject: 'Func. Rol', actual: latestEORTC.roleFunction, basal: baselineEORTC?.roleFunction ?? 0 },
    { subject: 'Func. Emocional', actual: latestEORTC.emotionalFunction, basal: baselineEORTC?.emotionalFunction ?? 0 },
    { subject: 'Func. Cognitiva', actual: latestEORTC.cognitiveFunction, basal: baselineEORTC?.cognitiveFunction ?? 0 },
    { subject: 'Func. Social', actual: latestEORTC.socialFunction, basal: baselineEORTC?.socialFunction ?? 0 },
  ] : []

  // EORTC symptoms evolution
  const eortcSymptomsData = patient.eortc.map(e => ({
    date: formatDate(e.date),
    Fatiga: e.fatigue,
    Dolor: e.pain,
    'Náuseas': e.nausea,
  }))

  // EORTC functional scales evolution
  const eortcFunctionalData = patient.eortc.map(e => ({
    date: formatDate(e.date),
    'Salud Global': e.globalHealth,
    'Func. Física': e.physicalFunction,
    'Func. Emocional': e.emotionalFunction,
  }))

  const latestFACIT = patient.facitf[patient.facitf.length - 1]
  const baselineFACIT = patient.facitf[0]
  const facitDelta = latestFACIT && baselineFACIT && latestFACIT !== baselineFACIT
    ? latestFACIT.totalScore - baselineFACIT.totalScore
    : null

  const latestPHQ9 = patient.phq9[patient.phq9.length - 1]
  const latestGAD7 = patient.gad7[patient.gad7.length - 1]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BarChart2 size={18} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Dashboard Clínico – PROMs/PREMs</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.name} · {patient.currentPhase} – {PHASE_LABELS[patient.currentPhase]}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="FACIT-F (fatiga)"
          value={latestFACIT ? `${latestFACIT.totalScore}/52` : 'N/D'}
          sub={facitDelta !== null ? `${facitDelta > 0 ? '+' : ''}${facitDelta} vs basal` : undefined}
          trend={facitDelta !== null ? (facitDelta > 0 ? 'up' : 'down') : undefined}
        />
        <StatCard
          label="EORTC Salud Global"
          value={latestEORTC ? `${latestEORTC.globalHealth}/100` : 'N/D'}
          sub={baselineEORTC && latestEORTC && latestEORTC !== baselineEORTC
            ? `${latestEORTC.globalHealth - baselineEORTC.globalHealth > 0 ? '+' : ''}${latestEORTC.globalHealth - baselineEORTC.globalHealth} vs basal`
            : undefined}
          trend={baselineEORTC && latestEORTC && latestEORTC !== baselineEORTC
            ? (latestEORTC.globalHealth >= baselineEORTC.globalHealth ? 'up' : 'down')
            : undefined}
        />
        <StatCard
          label="PHQ-9 (depresión)"
          value={latestPHQ9 ? `${latestPHQ9.totalScore}/27` : 'N/D'}
          sub={latestPHQ9 ? latestPHQ9.severity.replace('_', ' ') : undefined}
          trend={latestPHQ9 ? (latestPHQ9.totalScore < 5 ? 'up' : latestPHQ9.totalScore >= 10 ? 'down' : 'neutral') : undefined}
        />
        <StatCard
          label="GAD-7 (ansiedad)"
          value={latestGAD7 ? `${latestGAD7.totalScore}/21` : 'N/D'}
          sub={latestGAD7 ? latestGAD7.severity : undefined}
          trend={latestGAD7 ? (latestGAD7.totalScore < 5 ? 'up' : latestGAD7.totalScore >= 10 ? 'down' : 'neutral') : undefined}
        />
      </div>

      {/* FACIT-F & EORTC Functional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos FACIT-F</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Escalas Funcionales EORTC QLQ-C30</h3>
          <p className="text-xs text-slate-400 mb-4">Mayor puntuación = mejor función (0–100)</p>
          {eortcFunctionalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={eortcFunctionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Salud Global" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Func. Física" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Func. Emocional" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos EORTC</p>
          )}
        </div>
      </div>

      {/* EORTC Radar + Symptoms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">EORTC QLQ-C30 – Perfil Funcional</h3>
          <p className="text-xs text-slate-400 mb-4">Basal vs Actual</p>
          {eortcRadarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={eortcRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar name="Actual" dataKey="actual" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                <Radar name="Basal" dataKey="basal" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeDasharray="4 4" />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos EORTC</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Escalas de Síntomas EORTC</h3>
          <p className="text-xs text-slate-400 mb-4">Menor puntuación = menor sintomatología (0–100)</p>
          {eortcSymptomsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eortcSymptomsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Fatiga" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Dolor" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Náuseas" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos EORTC</p>
          )}
        </div>
      </div>

      {/* EORTC detail table */}
      {latestEORTC && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            EORTC QLQ-C30 – Última evaluación ({formatDate(latestEORTC.date)})
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Salud Global', value: latestEORTC.globalHealth, baseline: baselineEORTC?.globalHealth, type: 'functional' },
              { label: 'Función Física', value: latestEORTC.physicalFunction, baseline: baselineEORTC?.physicalFunction, type: 'functional' },
              { label: 'Función de Rol', value: latestEORTC.roleFunction, baseline: baselineEORTC?.roleFunction, type: 'functional' },
              { label: 'Función Emocional', value: latestEORTC.emotionalFunction, baseline: baselineEORTC?.emotionalFunction, type: 'functional' },
              { label: 'Función Cognitiva', value: latestEORTC.cognitiveFunction, baseline: baselineEORTC?.cognitiveFunction, type: 'functional' },
              { label: 'Función Social', value: latestEORTC.socialFunction, baseline: baselineEORTC?.socialFunction, type: 'functional' },
              { label: 'Fatiga', value: latestEORTC.fatigue, baseline: baselineEORTC?.fatigue, type: 'symptom' },
              { label: 'Náuseas/Vómitos', value: latestEORTC.nausea, baseline: baselineEORTC?.nausea, type: 'symptom' },
              { label: 'Dolor', value: latestEORTC.pain, baseline: baselineEORTC?.pain, type: 'symptom' },
            ].map(item => {
              const delta = item.baseline !== undefined ? item.value - item.baseline : null
              const isGood = item.type === 'functional' ? (delta ?? 0) >= 0 : (delta ?? 0) <= 0
              return (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <div className="flex items-end gap-2 mt-1">
                    <p className="text-lg font-bold text-slate-800">{item.value}</p>
                    {delta !== null && delta !== 0 && (
                      <p className={cn('text-xs font-medium mb-0.5', isGood ? 'text-green-600' : 'text-red-500')}>
                        {delta > 0 ? '+' : ''}{delta}
                      </p>
                    )}
                  </div>
                  {item.baseline !== undefined && (
                    <div className="mt-1.5">
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={cn('h-1.5 rounded-full', item.type === 'functional' ? 'bg-teal-500' : 'bg-orange-400')}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
