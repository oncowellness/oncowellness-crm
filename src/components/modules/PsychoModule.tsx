import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { Brain, AlertTriangle, CheckCircle, Plus, Info } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests, useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { useCrisisOrders } from '@/hooks/useCrisisOrders'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, cn } from '../../lib/utils'

const PHQ9_QUESTIONS = [
  'Poco interés o placer en hacer las cosas',
  'Sentirse decaído/a, deprimido/a o sin esperanzas',
  'Dificultad para quedarse o permanecer dormido/a, o dormir demasiado',
  'Sentirse cansado/a o tener poca energía',
  'Tener poco apetito o comer en exceso',
  'Sentirse mal consigo mismo/a o pensar que es un fracasado/a',
  'Dificultad para concentrarse en cosas',
  'Moverse o hablar tan lentamente que otras personas lo han notado',
  'Pensamientos de que estaría mejor muerto/a o de hacerse daño',
]

function computeSeverity(score: number) {
  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (score <= 19) return 'moderately_severe'
  return 'severe'
}

const SEVERITY_CONFIG = {
  minimal: { label: 'Mínimo', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', range: '0–4' },
  mild: { label: 'Leve', color: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', range: '5–9' },
  moderate: { label: 'Moderado', color: '#f59e0b', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', range: '10–14' },
  moderately_severe: { label: 'Moderadamente grave', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', range: '15–19' },
  severe: { label: 'Grave', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', range: '20–27' },
}

export function PsychoModule() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const { data: crisisOrders = [] } = useCrisisOrders(selectedPatientId)
  const createTest = useCreateClinicalTest()
  const { user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [answers, setAnswers] = useState<number[]>(new Array(9).fill(0))
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [justSubmitted, setJustSubmitted] = useState(false)

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const phq9Tests = clinicalTests.filter(t => t.tipo === 'PHQ-9')
  const latestPHQ9 = phq9Tests[phq9Tests.length - 1]
  const latestScore = latestPHQ9?.valor_numerico ?? 0
  const latestSeverity = computeSeverity(latestScore)

  const totalScore = answers.reduce((s, a) => s + a, 0)
  const severity = computeSeverity(totalScore)

  const chartData = phq9Tests.map(t => ({
    date: formatDate(t.created_at),
    'PHQ-9': t.valor_numerico ?? 0,
  }))

  function setAnswer(index: number, value: number) {
    setAnswers(prev => { const next = [...prev]; next[index] = value; return next })
  }

  function submitAssessment() {
    if (!selectedPatientId) return
    const score = answers.reduce((s, a) => s + a, 0)
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'PHQ-9',
      valor_numerico: score,
      valores_json: { answers: [...answers], severity: computeSeverity(score), date: assessmentDate },
      staff_id: user?.id ?? null,
    })
    setShowForm(false)
    setAnswers(new Array(9).fill(0))
    setJustSubmitted(true)
    setTimeout(() => setJustSubmitted(false), 4000)
  }

  const pendingCrisis = crisisOrders.filter(c => c.status === 'pendiente')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center"><Brain size={18} className="text-purple-600" /></div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Semáforo de Riesgo Psicológico</h2>
            <p className="text-xs text-slate-500">Paciente: {patient.nombre}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          <Plus size={14} /> Nuevo PHQ-9
        </button>
      </div>

      {justSubmitted && latestScore >= 10 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">🚨 Protocolo de Crisis Activado</p>
            <p className="text-sm text-red-600">PHQ-9 = {latestScore} (≥10). Alerta Roja y sesión PS-01 generada automáticamente.</p>
          </div>
        </div>
      )}
      {justSubmitted && latestScore < 10 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <p className="text-sm text-green-700">PHQ-9 registrado. Sin criterios de crisis.</p>
        </div>
      )}

      {pendingCrisis.length > 0 && !justSubmitted && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2"><AlertTriangle size={14} className="inline mr-1" />{pendingCrisis.length} Orden(es) de Crisis Pendiente(s)</p>
          {pendingCrisis.map(c => <p key={c.id} className="text-xs text-red-600">· {c.trigger_reason} · {formatDate(c.created_at)}</p>)}
        </div>
      )}

      {/* Risk semaphore */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(SEVERITY_CONFIG) as [string, typeof SEVERITY_CONFIG[keyof typeof SEVERITY_CONFIG]][]).map(([key, cfg]) => {
          const isActive = latestSeverity === key
          return (
            <div key={key} className={cn('rounded-xl border p-3 text-center transition-all', cfg.bg, cfg.border, isActive && 'ring-2 ring-offset-1 shadow-md scale-105')}>
              <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.color }} />
              <p className={cn('text-xs font-bold', cfg.text)}>{cfg.label}</p>
              <p className="text-[10px] text-slate-400">{cfg.range} pts</p>
              {isActive && <p className="text-[10px] font-semibold mt-1" style={{ color: cfg.color }}>← Actual</p>}
            </div>
          )
        })}
      </div>

      {/* PHQ-9 form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">PHQ-9 – Cuestionario sobre Salud del Paciente</h3>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-600">En las <strong>últimas 2 semanas</strong>, ¿con qué frecuencia le han molestado los siguientes problemas? (0=Nunca, 1=Varios días, 2=Más de la mitad, 3=Casi todos los días)</p>
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-600 block mb-1">Fecha de evaluación</label>
            <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div className="space-y-3">
            {PHQ9_QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-xs text-slate-500 w-4 shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-slate-700 flex-1">{q}</p>
                <div className="flex gap-2 shrink-0">
                  {[0, 1, 2, 3].map(v => (
                    <button key={v} onClick={() => setAnswer(i, v)} className={cn('w-8 h-8 rounded-lg text-sm font-medium border transition-colors', answers[i] === v ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300')}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={cn('mt-5 p-4 rounded-xl border flex items-center justify-between', totalScore >= 10 ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200')}>
            <div>
              <p className="text-sm text-slate-600">Puntuación total</p>
              <p className={cn('text-3xl font-bold', totalScore >= 10 ? 'text-red-600' : 'text-slate-800')}>{totalScore}<span className="text-sm font-normal text-slate-400"> / 27</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Severidad estimada</p>
              <p className={cn('text-sm font-semibold', SEVERITY_CONFIG[severity].text)}>{SEVERITY_CONFIG[severity].label}</p>
              {totalScore >= 10 && <p className="text-xs text-red-600 font-bold mt-1">⚡ Activará protocolo PS-01</p>}
            </div>
          </div>
          <button onClick={submitAssessment} disabled={createTest.isPending} className="mt-4 w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-60">
            {createTest.isPending ? 'Registrando...' : 'Registrar Evaluación PHQ-9'}
          </button>
        </div>
      )}

      {/* Historical chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolución PHQ-9</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 27]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Umbral crisis (10)', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="PHQ-9" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry['PHQ-9'] >= 10 ? '#ef4444' : entry['PHQ-9'] >= 5 ? '#f59e0b' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
