import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import {
  Droplets, AlertTriangle, AlertCircle, Plus, CheckCircle,
  Weight, Ruler, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests, useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { useAuth } from '@/contexts/AuthContext'
import { cn, formatDate } from '../../lib/utils'

type Tab = 'cribado' | 'valoracion' | 'evolucion'
type Limb = 'upper' | 'lower'
type Side = 'left' | 'right'

const UPPER_POINTS = [
  { key: 'mcp',      label: 'MCP' },
  { key: 'wrist',    label: 'Muñeca' },
  { key: 'elbow10d', label: '10 cm distal epicóndilo' },
  { key: 'elbow',    label: 'Epicóndilo' },
  { key: 'elbow10p', label: '10 cm proximal epicóndilo' },
  { key: 'elbow20p', label: '20 cm proximal epicóndilo' },
]
const LOWER_POINTS = [
  { key: 'forefoot', label: 'Antepié' },
  { key: 'ankle',    label: 'Tobillo' },
  { key: 'calf',     label: 'Pantorrilla' },
  { key: 'knee',     label: 'Rodilla' },
  { key: 'thigh10',  label: 'Muslo 10 cm' },
  { key: 'thigh20',  label: 'Muslo 20 cm' },
]
const ISL_STAGES = [
  { value: '0',   label: 'Estadio 0', desc: 'Sin edema visible, cambios subclínicos' },
  { value: 'I',   label: 'Estadio I', desc: 'Edema blando, reversible, con fóvea' },
  { value: 'II',  label: 'Estadio II', desc: 'Edema irreversible, fibrosis incipiente' },
  { value: 'III', label: 'Estadio III', desc: 'Elefantiasis, cambios cutáneos graves' },
]

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  const delta = current - prev
  if (delta < 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingDown size={12} />{delta.toFixed(1)}%</span>
  if (delta > 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingUp size={12} />+{delta.toFixed(1)}%</span>
  return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus size={12} />0%</span>
}

export function LymphedemaModule() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const createTest = useCreateClinicalTest()
  const { user } = useAuth()

  const [tab, setTab] = useState<Tab>('cribado')

  // ── Pestaña 1: Cribado ──────────────────────────────────────────────────────
  const [cancerType, setCancerType]     = useState('')
  const [surgeryType, setSurgeryType]   = useState('')
  const [nodesRemoved, setNodesRemoved] = useState<number | ''>('')
  const [radiotherapy, setRadiotherapy] = useState(false)
  const [weight, setWeight]             = useState<number | ''>('')
  const [height, setHeight]             = useState<number | ''>('')
  const [comorbidities, setComorbidities] = useState({ obesity: false, venousInsufficiency: false })
  const [symptoms, setSymptoms]   = useState({ heaviness: false, tension: false, tightClothing: false })
  const [redFlags, setRedFlags]   = useState({ acutePain: false, colorChange: false, suddenOnset: false })
  const [profileSaved, setProfileSaved] = useState(false)

  const bmi = useMemo(() => {
    if (typeof weight === 'number' && typeof height === 'number' && height > 0) {
      const hM = height / 100
      return (weight / (hM * hM)).toFixed(1)
    }
    return null
  }, [weight, height])

  const bmiCategory = useMemo(() => {
    if (!bmi) return null
    const v = parseFloat(bmi)
    if (v < 18.5) return { label: 'Bajo Peso',   color: 'text-blue-600',   bg: 'bg-blue-50' }
    if (v < 25)   return { label: 'Peso Normal',  color: 'text-green-600',  bg: 'bg-green-50' }
    if (v < 30)   return { label: 'Sobrepeso',    color: 'text-orange-600', bg: 'bg-orange-50' }
    return             { label: 'Obesidad',      color: 'text-red-600',    bg: 'bg-red-50' }
  }, [bmi])

  useEffect(() => {
    if (bmi && parseFloat(bmi) >= 30) {
      setComorbidities(prev => ({ ...prev, obesity: true }))
    }
  }, [bmi])

  const hasRedFlags = Object.values(redFlags).some(Boolean)

  function submitProfile() {
    if (!selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'LY_profile',
      valor_numerico: bmi ? parseFloat(bmi) : null,
      valores_json: { cancerType, surgeryType, nodesRemoved, radiotherapy, weight, height, bmi, comorbidities, symptoms, redFlags },
      is_baseline: profileTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  // ── Pestaña 2: Valoración ───────────────────────────────────────────────────
  const [showAssessForm, setShowAssessForm] = useState(false)
  const [limb, setLimb]     = useState<Limb>('upper')
  const [side, setSide]     = useState<Side>('left')
  const [affected, setAffected]         = useState<Record<string, string>>({})
  const [contralateral, setContralateral] = useState<Record<string, string>>({})
  const [stemmer, setStemmer]   = useState(false)
  const [pitting, setPitting]   = useState(false)
  const [islStage, setIslStage] = useState('0')

  const points = limb === 'upper' ? UPPER_POINTS : LOWER_POINTS

  const pctDiff = useMemo(() => {
    const affSum  = points.reduce((s, p) => s + (parseFloat(affected[p.key] || '0') || 0), 0)
    const conSum  = points.reduce((s, p) => s + (parseFloat(contralateral[p.key] || '0') || 0), 0)
    if (conSum === 0) return null
    return ((affSum - conSum) / conSum * 100)
  }, [affected, contralateral, points])

  function submitAssessment() {
    if (!selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'LY_assessment',
      valor_numerico: pctDiff !== null ? parseFloat(pctDiff.toFixed(1)) : null,
      valores_json: { limb, side, affected, contralateral, stemmer, pitting, islStage },
      is_baseline: assessmentTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowAssessForm(false)
    setAffected({})
    setContralateral({})
    setStemmer(false)
    setPitting(false)
    setIslStage('0')
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const profileTests    = clinicalTests.filter(t => t.tipo === 'LY_profile')
  const assessmentTests = clinicalTests.filter(t => t.tipo === 'LY_assessment')
  const latestAssessment = assessmentTests[assessmentTests.length - 1]
  const prevAssessment   = assessmentTests[assessmentTests.length - 2]

  const evolutionData = assessmentTests.map(t => ({
    date: formatDate(t.created_at),
    '% Diferencia': t.valor_numerico ?? 0,
    Estadio: (t.valores_json as any)?.islStage ?? '-',
  }))

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const latestJson = latestAssessment ? (latestAssessment.valores_json as any) : null

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
          <Droplets size={18} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Gestión de Linfedema</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.nombre}</p>
        </div>
        {latestJson && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Estadio actual:</span>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full',
              latestJson.islStage === '0'   && 'bg-green-100 text-green-700',
              latestJson.islStage === 'I'   && 'bg-yellow-100 text-yellow-700',
              latestJson.islStage === 'II'  && 'bg-orange-100 text-orange-700',
              latestJson.islStage === 'III' && 'bg-red-100 text-red-700',
            )}>ISL {latestJson.islStage}</span>
            {latestAssessment && prevAssessment && (
              <DeltaBadge
                current={latestAssessment.valor_numerico ?? 0}
                prev={prevAssessment.valor_numerico ?? 0}
              />
            )}
          </div>
        )}
      </div>

      {/* Red flag banner */}
      {hasRedFlags && tab === 'cribado' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Red Flags Detectadas</p>
            <p className="text-sm text-red-600 mt-0.5">
              Derivar a especialista vascular o descartar TVP/infección antes de iniciar tratamiento.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {([
          { id: 'cribado',    label: 'Cribado de Riesgo' },
          { id: 'valoracion', label: 'Valoración' },
          { id: 'evolucion',  label: 'Evolución' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'text-sm px-4 py-1.5 rounded-md transition-colors',
              tab === t.id
                ? 'bg-white text-teal-700 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Cribado ── */}
      {tab === 'cribado' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Izquierda */}
          <div className="space-y-5">
            {/* Antecedentes oncológicos */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Antecedentes Oncológicos</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tipo de Tumor</label>
                  <input
                    type="text"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    placeholder="Ej. Carcinoma ductal infiltrante mama izq."
                    value={cancerType}
                    onChange={e => setCancerType(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Cirugía</label>
                    <input
                      type="text"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      placeholder="Ej. Mastectomía"
                      value={surgeryType}
                      onChange={e => setSurgeryType(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Ganglios Ext.</label>
                    <input
                      type="number"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      placeholder="0"
                      value={nodesRemoved}
                      onChange={e => setNodesRemoved(e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={radiotherapy}
                    onChange={e => setRadiotherapy(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-600">Ha recibido Radioterapia</span>
                </label>
              </div>
            </section>

            {/* Biometría */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Biometría e IMC</h3>
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Peso (kg)</label>
                    <div className="relative">
                      <Weight size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        className="pl-8 w-full text-sm border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="0.0"
                        value={weight}
                        onChange={e => setWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Altura (cm)</label>
                    <div className="relative">
                      <Ruler size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        className="pl-8 w-full text-sm border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="0"
                        value={height}
                        onChange={e => setHeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                {bmi && bmiCategory && (
                  <div className={cn('p-3 rounded-lg text-center min-w-[90px]', bmiCategory.bg)}>
                    <p className="text-[10px] text-slate-500 mb-0.5">IMC</p>
                    <p className={cn('text-xl font-bold leading-none', bmiCategory.color)}>{bmi}</p>
                    <p className={cn('text-[10px] font-medium mt-1', bmiCategory.color)}>{bmiCategory.label}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Derecha: Cribado */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5">
            {/* Síntomas */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Síntomas Iniciales</p>
              <div className="space-y-2">
                {[
                  { key: 'heaviness',    label: 'Sensación de pesadez en el miembro' },
                  { key: 'tension',      label: 'Tensión o tirantez en la piel' },
                  { key: 'tightClothing',label: 'Ropa, anillos o reloj aprietan más' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-teal-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={symptoms[item.key as keyof typeof symptoms]}
                      onChange={e => setSymptoms({ ...symptoms, [item.key]: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Red flags */}
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <AlertCircle size={12} /> Red Flags
              </p>
              <div className="space-y-2">
                {[
                  { key: 'acutePain',    label: 'Dolor agudo o punzante' },
                  { key: 'colorChange',  label: 'Cambios de color (rojez, palidez)' },
                  { key: 'suddenOnset',  label: 'Inicio súbito del hinchazón' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2 bg-red-50/50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={redFlags[item.key as keyof typeof redFlags]}
                      onChange={e => setRedFlags({ ...redFlags, [item.key]: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comorbilidades */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Comorbilidades</p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comorbidities.obesity}
                    onChange={e => setComorbidities({ ...comorbidities, obesity: e.target.checked })}
                    className="rounded text-slate-600"
                  />
                  <span className="text-sm text-slate-600">Obesidad</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={comorbidities.venousInsufficiency}
                    onChange={e => setComorbidities({ ...comorbidities, venousInsufficiency: e.target.checked })}
                    className="rounded text-slate-600"
                  />
                  <span className="text-sm text-slate-600">Insuf. Venosa</span>
                </label>
              </div>
            </div>

            <button
              onClick={submitProfile}
              disabled={createTest.isPending}
              className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white py-2.5 rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-60"
            >
              {profileSaved ? <CheckCircle size={16} /> : <Droplets size={16} />}
              {profileSaved ? 'Guardado' : 'Guardar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Valoración ── */}
      {tab === 'valoracion' && (
        <div className="space-y-5">
          {/* Botón registrar */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAssessForm(!showAssessForm)}
              className="flex items-center gap-1.5 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg border border-teal-200 transition-colors"
            >
              <Plus size={14} /> Nueva Valoración
            </button>
          </div>

          {/* Formulario inline */}
          {showAssessForm && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-5">
              {/* Miembro y lado */}
              <div className="flex gap-6 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Miembro Afecto</p>
                  <div className="flex gap-2">
                    {(['upper', 'lower'] as Limb[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLimb(l); setAffected({}); setContralateral({}) }}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                          limb === l
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300',
                        )}
                      >{l === 'upper' ? 'Miembro Superior' : 'Miembro Inferior'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Lado Afecto</p>
                  <div className="flex gap-2">
                    {(['left', 'right'] as Side[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSide(s)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                          side === s
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300',
                        )}
                      >{s === 'left' ? 'Izquierdo' : 'Derecho'}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mediciones circunferenciales */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-3">Mediciones Circunferenciales (cm)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-teal-200">
                        <th className="text-left text-xs text-slate-500 py-2 pr-4 font-medium">Punto</th>
                        <th className="text-left text-xs text-teal-600 py-2 pr-4 font-semibold">Afecto</th>
                        <th className="text-left text-xs text-slate-500 py-2 font-semibold">Contralateral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map(pt => (
                        <tr key={pt.key} className="border-b border-teal-100">
                          <td className="py-2 pr-4 text-slate-600 text-xs">{pt.label}</td>
                          <td className="py-1.5 pr-4">
                            <input
                              type="number"
                              step="0.1"
                              className="w-20 text-sm border border-teal-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                              placeholder="0.0"
                              value={affected[pt.key] ?? ''}
                              onChange={e => setAffected({ ...affected, [pt.key]: e.target.value })}
                            />
                          </td>
                          <td className="py-1.5">
                            <input
                              type="number"
                              step="0.1"
                              className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
                              placeholder="0.0"
                              value={contralateral[pt.key] ?? ''}
                              onChange={e => setContralateral({ ...contralateral, [pt.key]: e.target.value })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pctDiff !== null && (
                  <div className={cn(
                    'mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold',
                    pctDiff <= 5  ? 'bg-green-50 text-green-700'  :
                    pctDiff <= 20 ? 'bg-orange-50 text-orange-700' :
                                    'bg-red-50 text-red-700',
                  )}>
                    Diferencia: {pctDiff > 0 ? '+' : ''}{pctDiff.toFixed(1)}%
                    <span className="text-xs font-normal opacity-75">
                      {pctDiff <= 5 ? '(subcrítico)' : pctDiff <= 20 ? '(moderado)' : '(severo)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Tests clínicos */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Tests Clínicos</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stemmer}
                        onChange={e => setStemmer(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700">Stemmer +</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pitting}
                        onChange={e => setPitting(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700">Fóvea +</span>
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Estadio ISL</p>
                  <div className="flex gap-2 flex-wrap">
                    {ISL_STAGES.map(st => (
                      <button
                        key={st.value}
                        onClick={() => setIslStage(st.value)}
                        title={st.desc}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                          islStage === st.value
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300',
                        )}
                      >{st.label}</button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {ISL_STAGES.find(s => s.value === islStage)?.desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitAssessment}
                  disabled={createTest.isPending}
                  className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 text-sm"
                >
                  <CheckCircle size={15} /> Guardar Valoración
                </button>
                <button
                  onClick={() => setShowAssessForm(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Última valoración */}
          {latestAssessment && latestJson && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Última Valoración</h3>
                <span className="text-xs text-slate-400">{formatDate(latestAssessment.created_at)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Miembro</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {latestJson.limb === 'upper' ? 'Superior' : 'Inferior'} {latestJson.side === 'left' ? 'Izq.' : 'Der.'}
                  </p>
                </div>
                <div className={cn('text-center p-3 rounded-lg',
                  (latestAssessment.valor_numerico ?? 0) <= 5  ? 'bg-green-50'  :
                  (latestAssessment.valor_numerico ?? 0) <= 20 ? 'bg-orange-50' : 'bg-red-50',
                )}>
                  <p className="text-xs text-slate-500 mb-1">% Diferencia</p>
                  <p className={cn('text-lg font-bold',
                    (latestAssessment.valor_numerico ?? 0) <= 5  ? 'text-green-700'  :
                    (latestAssessment.valor_numerico ?? 0) <= 20 ? 'text-orange-700' : 'text-red-700',
                  )}>
                    {(latestAssessment.valor_numerico ?? 0) > 0 ? '+' : ''}{latestAssessment.valor_numerico ?? 0}%
                  </p>
                </div>
                <div className={cn('text-center p-3 rounded-lg',
                  latestJson.islStage === '0'   ? 'bg-green-50'  :
                  latestJson.islStage === 'I'   ? 'bg-yellow-50' :
                  latestJson.islStage === 'II'  ? 'bg-orange-50' : 'bg-red-50',
                )}>
                  <p className="text-xs text-slate-500 mb-1">Estadio ISL</p>
                  <p className={cn('text-lg font-bold',
                    latestJson.islStage === '0'   ? 'text-green-700'  :
                    latestJson.islStage === 'I'   ? 'text-yellow-700' :
                    latestJson.islStage === 'II'  ? 'text-orange-700' : 'text-red-700',
                  )}>
                    {latestJson.islStage === '0' ? 'Estadio 0' : `Estadio ${latestJson.islStage}`}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Tests</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {[latestJson.stemmer && 'Stemmer +', latestJson.pitting && 'Fóvea +'].filter(Boolean).join(' · ') || 'Negativos'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          {assessmentTests.length > 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Historial de Valoraciones</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">Fecha</th>
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">Miembro</th>
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">Estadio ISL</th>
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">% Diferencia</th>
                      <th className="text-left text-slate-500 py-2 font-medium">Tests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...assessmentTests].reverse().map((t, i) => {
                      const j = t.valores_json as any
                      const next = [...assessmentTests].reverse()[i + 1]
                      return (
                        <tr key={t.id} className="border-b border-slate-50">
                          <td className="py-2 pr-4 text-slate-600">{formatDate(t.created_at)}</td>
                          <td className="py-2 pr-4 text-slate-700 capitalize">
                            {j?.limb === 'upper' ? 'Superior' : 'Inferior'} {j?.side === 'left' ? 'Izq.' : 'Der.'}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={cn('font-semibold',
                              j?.islStage === '0'   ? 'text-green-600'  :
                              j?.islStage === 'I'   ? 'text-yellow-600' :
                              j?.islStage === 'II'  ? 'text-orange-600' : 'text-red-600',
                            )}>
                              {j?.islStage === '0' ? 'Estadio 0' : `Estadio ${j?.islStage}`}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-medium text-slate-800">
                            <div className="flex items-center gap-1.5">
                              {(t.valor_numerico ?? 0) > 0 ? '+' : ''}{t.valor_numerico ?? 0}%
                              {next && <DeltaBadge current={t.valor_numerico ?? 0} prev={next.valor_numerico ?? 0} />}
                            </div>
                          </td>
                          <td className="py-2 text-slate-500">
                            {[j?.stemmer && 'Stemmer +', j?.pitting && 'Fóvea +'].filter(Boolean).join(' · ') || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {assessmentTests.length === 0 && !showAssessForm && (
            <div className="text-center py-12 text-slate-400 text-sm">
              Sin valoraciones registradas. Pulsa "Nueva Valoración" para comenzar.
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Evolución ── */}
      {tab === 'evolucion' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Valoraciones</p>
              <p className="text-2xl font-bold text-teal-600">{assessmentTests.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">% Diferencia Actual</p>
              <p className={cn('text-2xl font-bold',
                !latestAssessment                             ? 'text-slate-300' :
                (latestAssessment.valor_numerico ?? 0) <= 5  ? 'text-green-600'  :
                (latestAssessment.valor_numerico ?? 0) <= 20 ? 'text-orange-600' : 'text-red-600',
              )}>
                {latestAssessment
                  ? `${(latestAssessment.valor_numerico ?? 0) > 0 ? '+' : ''}${latestAssessment.valor_numerico ?? 0}%`
                  : 'N/D'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Estadio Actual</p>
              <p className={cn('text-2xl font-bold',
                !latestJson                          ? 'text-slate-300' :
                latestJson.islStage === '0'          ? 'text-green-600'  :
                latestJson.islStage === 'I'          ? 'text-yellow-600' :
                latestJson.islStage === 'II'         ? 'text-orange-600' : 'text-red-600',
              )}>
                {latestJson ? (latestJson.islStage === '0' ? 'Est. 0' : `Est. ${latestJson.islStage}`) : 'N/D'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Tendencia</p>
              <div className="mt-1">
                {latestAssessment && prevAssessment
                  ? <DeltaBadge current={latestAssessment.valor_numerico ?? 0} prev={prevAssessment.valor_numerico ?? 0} />
                  : <span className="text-slate-300 text-sm">N/D</span>}
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolución % Diferencia Intermembros</h3>
            {evolutionData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, '% Diferencia']} />
                  <Legend />
                  <ReferenceLine y={5}  stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Moderado', fontSize: 10, fill: '#f59e0b' }} />
                  <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Severo', fontSize: 10, fill: '#ef4444' }} />
                  <Line
                    type="monotone"
                    dataKey="% Diferencia"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ fill: '#0d9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Se necesitan al menos 2 valoraciones para mostrar la evolución.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
