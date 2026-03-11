import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  Droplets, AlertTriangle, AlertCircle, Plus, CheckCircle,
  Weight, Ruler, TrendingUp, TrendingDown, Minus,
  FileDown, ClipboardList, Shirt,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests, useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { useAuth } from '@/contexts/AuthContext'
import { cn, formatDate } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'perfil' | 'evaluacion' | 'tratamiento' | 'evolucion' | 'exportacion'
type EvalMode = 'isl' | 'ow'
type LimbSide = 'left' | 'right'

// ─── Constants ────────────────────────────────────────────────────────────────
const ISL_POINTS = [
  { key: 'mcp',        label: 'Metacarpofalángicas' },
  { key: 'wrist',      label: 'Muñeca' },
  { key: 'midForearm', label: 'Mitad Antebrazo' },
  { key: 'elbow',      label: 'Codo' },
  { key: 'midArm',     label: 'Mitad Brazo' },
  { key: 'arm65',      label: '65% del Brazo' },
]
// Fixed distances (cm) between consecutive ISL points
const ISL_H = [8, 8, 8, 8, 6]

const OW_FINGER_POINTS = [
  { key: 'd1', label: '1er dedo (pulgar)' },
  { key: 'd2', label: '2º dedo (índice)' },
  { key: 'd3', label: '3er dedo (medio)' },
  { key: 'd4', label: '4º dedo (anular)' },
  { key: 'd5', label: '5º dedo (meñique)' },
]
const OW_VOL_POINTS = [
  { key: 'wrist', label: 'Muñeca' },
  { key: 'm1',   label: 'M1  (+5 cm)' },
  { key: 'm2',   label: 'M2 (+10 cm)' },
  { key: 'm3',   label: 'M3 (+15 cm)' },
  { key: 'm4',   label: 'M4 (+20 cm)' },
  { key: 'm5',   label: 'M5 (+25 cm)' },
  { key: 'm6',   label: 'M6 (+30 cm)' },
  { key: 'm7',   label: 'M7 (+35 cm)' },
  { key: 'm8',   label: 'M8 (+40 cm)' },
  { key: 'm9',   label: 'M9 (+45 cm)' },
  { key: 'm10',  label: 'M10 (+50 cm)' },
]

const ISL_STAGE_INFO = [
  { value: '0',   label: 'Estadio 0',   color: 'text-green-700',  bg: 'bg-green-50',  desc: 'Sin edema visible. Linfedema subclínico.' },
  { value: 'I',   label: 'Estadio I',   color: 'text-yellow-700', bg: 'bg-yellow-50', desc: 'Edema blando con fóvea, reversible con elevación.' },
  { value: 'II',  label: 'Estadio II',  color: 'text-orange-700', bg: 'bg-orange-50', desc: 'Edema irreversible, posible fibrosis incipiente.' },
  { value: 'III', label: 'Estadio III', color: 'text-red-700',    bg: 'bg-red-50',    desc: 'Elefantiasis. Cambios cutáneos graves.' },
]

const PITTING_GRADES = [
  { v: 0, label: 'Negativo' },
  { v: 1, label: '1+ (2 mm)' },
  { v: 2, label: '2+ (4 mm)' },
  { v: 3, label: '3+ (6 mm)' },
  { v: 4, label: '4+ (8 mm)' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Truncated cone volume: V = h(C1²+C2²+C1·C2) / 12π  →  cm³ = mL */
function truncatedCone(c1: number, c2: number, h: number): number {
  if (c1 <= 0 || c2 <= 0 || h <= 0) return 0
  return (h * (c1 * c1 + c2 * c2 + c1 * c2)) / (12 * Math.PI)
}

function calcISLVolume(m: Record<string, string>): { total: number; segs: number[] } {
  const keys = ISL_POINTS.map(p => p.key)
  const segs: number[] = []
  let total = 0
  for (let i = 0; i < keys.length - 1; i++) {
    const c1 = parseFloat(m[keys[i]] || '0')
    const c2 = parseFloat(m[keys[i + 1]] || '0')
    const v = truncatedCone(c1, c2, ISL_H[i])
    segs.push(v)
    total += v
  }
  return { total, segs }
}

function calcOWVolume(m: Record<string, string>): { total: number; segs: number[] } {
  const keys = OW_VOL_POINTS.map(p => p.key)
  const segs: number[] = []
  let total = 0
  for (let i = 0; i < keys.length - 1; i++) {
    const c1 = parseFloat(m[keys[i]] || '0')
    const c2 = parseFloat(m[keys[i + 1]] || '0')
    const v = truncatedCone(c1, c2, 5)
    segs.push(v)
    total += v
  }
  return { total, segs }
}

function suggestStage(pctExcess: number, stemmer: boolean, pitting: number): string {
  if (pctExcess > 40 || pitting >= 3) return 'III'
  if (pctExcess > 20 || pitting >= 2 || (stemmer && pctExcess > 10)) return 'II'
  if (pctExcess >= 10 || (stemmer && pctExcess >= 5) || pitting === 1) return 'I'
  return '0'
}

function segColor(excessPct: number) {
  if (excessPct < 0)  return { bar: 'bg-blue-200',   text: 'text-blue-700'   }
  if (excessPct < 5)  return { bar: 'bg-green-200',  text: 'text-green-700'  }
  if (excessPct < 10) return { bar: 'bg-yellow-200', text: 'text-yellow-700' }
  if (excessPct < 20) return { bar: 'bg-orange-200', text: 'text-orange-700' }
  return                     { bar: 'bg-red-200',    text: 'text-red-700'    }
}

function exportCSV(
  evaluations: any[],
  profileTests: any[],
  patientId: string,
) {
  const anonId = patientId.slice(0, 8).toUpperCase()
  const latestProfile = profileTests[profileTests.length - 1]
  const pj = latestProfile?.valores_json as any
  const bmi = pj?.bmi ?? ''

  const headers = [
    'ID_Paciente', 'Fecha', 'Modo', 'Lado_Afecto',
    'Vol_Afecto_mL', 'Vol_Contralateral_mL', 'Diferencia_mL', 'Exceso_Pct',
    'Estadio_ISL', 'Stemmer', 'Fovea',
    'MCP_A', 'Muneca_A', 'MidAntebrazo_A', 'Codo_A', 'MidBrazo_A', 'Brazo65_A',
    'MCP_C', 'Muneca_C', 'MidAntebrazo_C', 'Codo_C', 'MidBrazo_C', 'Brazo65_C',
    'OW_Muneca_A', 'OW_M1_A', 'OW_M2_A', 'OW_M3_A', 'OW_M4_A', 'OW_M5_A',
    'OW_M6_A', 'OW_M7_A', 'OW_M8_A', 'OW_M9_A', 'OW_M10_A',
    'OW_Muneca_C', 'OW_M1_C', 'OW_M2_C', 'OW_M3_C', 'OW_M4_C', 'OW_M5_C',
    'OW_M6_C', 'OW_M7_C', 'OW_M8_C', 'OW_M9_C', 'OW_M10_C',
    'IMC',
  ]

  const rows = evaluations.map(e => {
    const j = e.valores_json as any
    const isISL = j?.mode === 'isl'
    const a = j?.affected ?? {}
    const c = j?.contralateral ?? {}
    return [
      anonId,
      (e.created_at ?? '').split('T')[0],
      j?.mode ?? '',
      j?.side ?? '',
      j?.volAffected?.toFixed(1) ?? '',
      j?.volContralateral?.toFixed(1) ?? '',
      e.valor_numerico ?? '',
      j?.pctExcess?.toFixed(1) ?? '',
      j?.islStage ?? '',
      j?.stemmer ? 1 : 0,
      j?.pitting ?? 0,
      isISL ? (a.mcp ?? '') : '', isISL ? (a.wrist ?? '') : '',
      isISL ? (a.midForearm ?? '') : '', isISL ? (a.elbow ?? '') : '',
      isISL ? (a.midArm ?? '') : '', isISL ? (a.arm65 ?? '') : '',
      isISL ? (c.mcp ?? '') : '', isISL ? (c.wrist ?? '') : '',
      isISL ? (c.midForearm ?? '') : '', isISL ? (c.elbow ?? '') : '',
      isISL ? (c.midArm ?? '') : '', isISL ? (c.arm65 ?? '') : '',
      !isISL ? (a.wrist ?? '') : '', !isISL ? (a.m1 ?? '') : '',
      !isISL ? (a.m2 ?? '') : '', !isISL ? (a.m3 ?? '') : '',
      !isISL ? (a.m4 ?? '') : '', !isISL ? (a.m5 ?? '') : '',
      !isISL ? (a.m6 ?? '') : '', !isISL ? (a.m7 ?? '') : '',
      !isISL ? (a.m8 ?? '') : '', !isISL ? (a.m9 ?? '') : '',
      !isISL ? (a.m10 ?? '') : '',
      !isISL ? (c.wrist ?? '') : '', !isISL ? (c.m1 ?? '') : '',
      !isISL ? (c.m2 ?? '') : '', !isISL ? (c.m3 ?? '') : '',
      !isISL ? (c.m4 ?? '') : '', !isISL ? (c.m5 ?? '') : '',
      !isISL ? (c.m6 ?? '') : '', !isISL ? (c.m7 ?? '') : '',
      !isISL ? (c.m8 ?? '') : '', !isISL ? (c.m9 ?? '') : '',
      !isISL ? (c.m10 ?? '') : '',
      bmi,
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `linfedema_${anonId}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  const d = current - prev
  if (d < 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingDown size={12} />{d.toFixed(1)}</span>
  if (d > 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingUp size={12} />+{d.toFixed(1)}</span>
  return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus size={12} />0</span>
}

function MirrorInput({
  points, affected, contralateral, onAffected, onContralateral, segExcesses,
}: {
  points: { key: string; label: string }[]
  affected: Record<string, string>
  contralateral: Record<string, string>
  onAffected: (k: string, v: string) => void
  onContralateral: (k: string, v: string) => void
  segExcesses?: number[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-right text-xs font-semibold text-teal-600 py-2 pr-3 w-1/3">Afecto</th>
            <th className="text-center text-xs font-medium text-slate-500 py-2 px-2">Punto</th>
            <th className="text-left text-xs font-semibold text-slate-500 py-2 pl-3 w-1/3">Contralateral</th>
            {segExcesses && <th className="text-left text-xs font-medium text-slate-400 py-2 pl-2">Δ%</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((pt, i) => {
            const excess = segExcesses?.[i]
            const col = excess !== undefined ? segColor(excess) : null
            return (
              <tr key={pt.key} className="border-b border-slate-50">
                <td className="py-1.5 pr-3 text-right">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    className="w-20 text-sm border border-teal-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-300 text-right"
                    placeholder="—"
                    value={affected[pt.key] ?? ''}
                    onChange={e => onAffected(pt.key, e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span className="text-xs text-slate-600 whitespace-nowrap">{pt.label}</span>
                </td>
                <td className="py-1.5 pl-3">
                  <input
                    type="number" step="0.1" min="0" max="100"
                    className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="—"
                    value={contralateral[pt.key] ?? ''}
                    onChange={e => onContralateral(pt.key, e.target.value)}
                  />
                </td>
                {col && excess !== undefined && (
                  <td className="py-1.5 pl-2">
                    <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', col.bar, col.text)}>
                      {excess > 0 ? '+' : ''}{excess.toFixed(1)}%
                    </span>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LymphedemaModule() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const createTest = useCreateClinicalTest()
  const { user } = useAuth()

  const [tab, setTab] = useState<Tab>('perfil')

  // ── Tab 1: Perfil ──────────────────────────────────────────────────────────
  const [cancerType, setCancerType]     = useState('')
  const [surgeryType, setSurgeryType]   = useState('')
  const [nodesRemoved, setNodesRemoved] = useState<number | ''>('')
  const [radiotherapy, setRadiotherapy] = useState(false)
  const [rtSessions, setRtSessions]     = useState<number | ''>('')
  const [weight, setWeight]             = useState<number | ''>('')
  const [height, setHeight]             = useState<number | ''>('')
  const [cellulitis, setCellulitis]     = useState(false)
  const [comorbidities, setComorbidities] = useState({ obesity: false, venousInsufficiency: false })
  const [symptoms, setSymptoms] = useState({ heaviness: false, tension: false, tightClothing: false })
  const [redFlags, setRedFlags] = useState({ acutePain: false, colorChange: false, suddenOnset: false })
  const [profileSaved, setProfileSaved] = useState(false)

  const bmi = useMemo(() => {
    if (typeof weight === 'number' && typeof height === 'number' && height > 0) {
      return ((weight / ((height / 100) ** 2))).toFixed(1)
    }
    return null
  }, [weight, height])

  const bmiCategory = useMemo(() => {
    if (!bmi) return null
    const v = parseFloat(bmi)
    if (v < 18.5) return { label: 'Bajo Peso',  color: 'text-blue-600',   bg: 'bg-blue-50' }
    if (v < 25)   return { label: 'Peso Normal', color: 'text-green-600',  bg: 'bg-green-50' }
    if (v < 30)   return { label: 'Sobrepeso',   color: 'text-orange-600', bg: 'bg-orange-50' }
    return              { label: 'Obesidad',     color: 'text-red-600',    bg: 'bg-red-50' }
  }, [bmi])

  useEffect(() => {
    if (bmi && parseFloat(bmi) >= 30) setComorbidities(p => ({ ...p, obesity: true }))
  }, [bmi])

  const hasRedFlags = Object.values(redFlags).some(Boolean)

  const profileTests = clinicalTests.filter(t => t.tipo === 'LY_profile')

  function submitProfile() {
    if (!selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'LY_profile',
      valor_numerico: bmi ? parseFloat(bmi) : null,
      valores_json: { cancerType, surgeryType, nodesRemoved, radiotherapy, rtSessions, weight, height, bmi, cellulitis, comorbidities, symptoms, redFlags },
      is_baseline: profileTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  // ── Tab 2: Evaluación ─────────────────────────────────────────────────────
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [evalMode, setEvalMode]         = useState<EvalMode>('isl')
  const [side, setSide]                 = useState<LimbSide>('left')
  const [affMeas, setAffMeas]           = useState<Record<string, string>>({})
  const [conMeas, setConMeas]           = useState<Record<string, string>>({})
  const [stemmer, setStemmer]           = useState(false)
  const [pitting, setPitting]           = useState(0)
  const [islStage, setIslStage]         = useState('0')
  const [stageOverridden, setStageOverridden] = useState(false)

  const evalVolumes = useMemo(() => {
    const fn = evalMode === 'isl' ? calcISLVolume : calcOWVolume
    const aff = fn(affMeas)
    const con = fn(conMeas)
    const diff = aff.total - con.total
    const pct = con.total > 0 ? (diff / con.total) * 100 : 0
    const segExcesses = aff.segs.map((v, i) => {
      const cv = con.segs[i] ?? 0
      return cv > 0 ? ((v - cv) / cv) * 100 : 0
    })
    return { aff, con, diff, pct, segExcesses }
  }, [affMeas, conMeas, evalMode])

  const suggestedStage = useMemo(
    () => suggestStage(evalVolumes.pct, stemmer, pitting),
    [evalVolumes.pct, stemmer, pitting],
  )

  useEffect(() => {
    if (!stageOverridden) setIslStage(suggestedStage)
  }, [suggestedStage, stageOverridden])

  const evalAlertDiff   = evalVolumes.diff > 200
  const evalAlertExcess = evalVolumes.pct > 10

  const evalTests = clinicalTests.filter(t =>
    t.tipo === 'LY_eval_isl' || t.tipo === 'LY_eval_ow' || t.tipo === 'LY_assessment',
  )
  const latestEval = evalTests[evalTests.length - 1]
  const latestEvalJson = latestEval?.valores_json as any

  function resetEvalForm() {
    setAffMeas({}); setConMeas({})
    setStemmer(false); setPitting(0); setStageOverridden(false)
  }

  function submitEval() {
    if (!selectedPatientId) return
    const tipo = evalMode === 'isl' ? 'LY_eval_isl' : 'LY_eval_ow'
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo,
      valor_numerico: parseFloat(evalVolumes.diff.toFixed(1)),
      valores_json: {
        mode: evalMode, side,
        affected: affMeas, contralateral: conMeas,
        volAffected: parseFloat(evalVolumes.aff.total.toFixed(1)),
        volContralateral: parseFloat(evalVolumes.con.total.toFixed(1)),
        pctExcess: parseFloat(evalVolumes.pct.toFixed(1)),
        stemmer, pitting, islStage,
        segExcesses: evalVolumes.segExcesses.map(v => parseFloat(v.toFixed(1))),
      },
      is_baseline: evalTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowEvalForm(false)
    resetEvalForm()
  }

  // ── Tab 3: Tratamiento ────────────────────────────────────────────────────
  const [showTreatForm, setShowTreatForm] = useState(false)
  const [treatDate, setTreatDate]   = useState(new Date().toISOString().split('T')[0])
  const [dlm, setDlm]               = useState(false)
  const [dlmMins, setDlmMins]       = useState('')
  const [bandage, setBandage]       = useState(false)
  const [bandageDays, setBandageDays] = useState('')
  const [garment, setGarment]       = useState(false)
  const [garmentType, setGarmentType] = useState('sleeve')
  const [garmentClass, setGarmentClass] = useState('II')
  const [garmentMmhg, setGarmentMmhg] = useState('')

  const treatmentTests = clinicalTests.filter(t => t.tipo === 'LY_treatment')

  function submitTreatment() {
    if (!selectedPatientId || (!dlm && !bandage && !garment)) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'LY_treatment',
      valor_numerico: dlmMins ? parseFloat(dlmMins) : null,
      valores_json: {
        date: treatDate, dlm, dlmMins: dlmMins ? parseInt(dlmMins) : null,
        bandage, bandageDays: bandageDays ? parseInt(bandageDays) : null,
        garment, garmentType, garmentClass, garmentMmhg: garmentMmhg || null,
      },
      is_baseline: false,
      staff_id: user?.id ?? null,
    })
    setShowTreatForm(false)
    setDlm(false); setDlmMins(''); setBandage(false); setBandageDays('')
    setGarment(false); setGarmentMmhg('')
  }

  // ── Tab 4: Evolución ──────────────────────────────────────────────────────
  const evolutionData = evalTests.map(t => {
    const j = t.valores_json as any
    return {
      date: formatDate(t.created_at),
      'Afecto (mL)': parseFloat((j?.volAffected ?? 0).toFixed(0)),
      'Contralateral (mL)': parseFloat((j?.volContralateral ?? 0).toFixed(0)),
      'Diferencia (mL)': parseFloat((t.valor_numerico ?? 0).toFixed(0)),
    }
  })

  const latestOwEval = [...evalTests].reverse().find(t => t.tipo === 'LY_eval_ow')
  const latestOwJson = latestOwEval?.valores_json as any
  const heatmapSegs: number[] = latestOwJson?.segExcesses ?? []

  // ── Tab 5: Exportación ────────────────────────────────────────────────────
  const [lymqol, setLymqol] = useState({ symptoms: '', func: '', appearance: '', mood: '' })
  const [lymqolSaved, setLymqolSaved] = useState(false)

  function saveLymqol() {
    if (!selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'LY_lymqol',
      valor_numerico: null,
      valores_json: { ...lymqol, date: new Date().toISOString() },
      is_baseline: false,
      staff_id: user?.id ?? null,
    })
    setLymqolSaved(true)
    setTimeout(() => setLymqolSaved(false), 3000)
  }

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const currentStageInfo = ISL_STAGE_INFO.find(s => s.value === (latestEvalJson?.islStage ?? '0'))

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
          <Droplets size={18} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Gestión de Linfedema</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.nombre}</p>
        </div>
        {latestEvalJson && (
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            {(evalAlertDiff || latestEvalJson.volAffected - latestEvalJson.volContralateral > 200) && (
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={11} /> {`>${evalTests[evalTests.length - 1]?.valor_numerico?.toFixed(0)} mL`}
              </span>
            )}
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', currentStageInfo?.bg, currentStageInfo?.color)}>
              ISL {latestEvalJson.islStage ?? '0'}
            </span>
            {evalTests.length >= 2 && (
              <DeltaBadge
                current={evalTests[evalTests.length - 1]?.valor_numerico ?? 0}
                prev={evalTests[evalTests.length - 2]?.valor_numerico ?? 0}
              />
            )}
          </div>
        )}
      </div>

      {/* Global red flag banner */}
      {hasRedFlags && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">Red Flags en Perfil</p>
            <p className="text-sm text-red-600 mt-0.5">Descartar TVP/infección. Derivar a vascular antes de iniciar tratamiento.</p>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {([
          { id: 'perfil',       label: 'Perfil de Riesgo' },
          { id: 'evaluacion',   label: 'Evaluación' },
          { id: 'tratamiento',  label: 'Tratamiento' },
          { id: 'evolucion',    label: 'Evolución' },
          { id: 'exportacion',  label: 'Exportación' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'text-sm px-4 py-1.5 rounded-lg transition-colors',
              tab === t.id
                ? 'bg-white text-teal-700 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* ════════════════════ TAB 1: PERFIL ════════════════════ */}
      {tab === 'perfil' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Antecedentes oncológicos */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Antecedentes Oncológicos</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tipo de Tumor</label>
                  <input type="text" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Ej. Carcinoma ductal infiltrante mama izq." value={cancerType} onChange={e => setCancerType(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Cirugía</label>
                    <input type="text" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Ej. Mastectomía" value={surgeryType} onChange={e => setSurgeryType(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Ganglios Ext.</label>
                    <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="0" value={nodesRemoved} onChange={e => setNodesRemoved(e.target.value === '' ? '' : parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input type="checkbox" checked={radiotherapy} onChange={e => setRadiotherapy(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-slate-600">Radioterapia</span>
                  </label>
                  {radiotherapy && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">Nº Sesiones RT</label>
                      <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="0" value={rtSessions} onChange={e => setRtSessions(e.target.value === '' ? '' : parseInt(e.target.value))} />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={cellulitis} onChange={e => setCellulitis(e.target.checked)} className="rounded text-red-500 focus:ring-red-400" />
                  <span className="text-sm text-slate-600">Antecedente de Celulitis</span>
                  {cellulitis && <span className="text-xs text-red-600 font-medium">⚠ Factor de riesgo</span>}
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
                      <input type="number" className="pl-8 w-full text-sm border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="0.0" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Altura (cm)</label>
                    <div className="relative">
                      <Ruler size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input type="number" className="pl-8 w-full text-sm border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="0" value={height} onChange={e => setHeight(e.target.value === '' ? '' : parseFloat(e.target.value))} />
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

          {/* Cribado */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Síntomas Iniciales</p>
              <div className="space-y-2">
                {[
                  { key: 'heaviness',    label: 'Sensación de pesadez en el miembro' },
                  { key: 'tension',      label: 'Tensión o tirantez en la piel' },
                  { key: 'tightClothing', label: 'Ropa, anillos o reloj aprietan más' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-teal-200 transition-colors">
                    <input type="checkbox" checked={symptoms[item.key as keyof typeof symptoms]} onChange={e => setSymptoms({ ...symptoms, [item.key]: e.target.checked })} className="rounded text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1"><AlertCircle size={12} /> Red Flags</p>
              <div className="space-y-2">
                {[
                  { key: 'acutePain',   label: 'Dolor agudo o punzante' },
                  { key: 'colorChange', label: 'Cambios de color (rojez, palidez)' },
                  { key: 'suddenOnset', label: 'Inicio súbito del hinchazón' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2 bg-red-50/50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                    <input type="checkbox" checked={redFlags[item.key as keyof typeof redFlags]} onChange={e => setRedFlags({ ...redFlags, [item.key]: e.target.checked })} className="rounded text-red-600 focus:ring-red-500" />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Comorbilidades</p>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={comorbidities.obesity} onChange={e => setComorbidities({ ...comorbidities, obesity: e.target.checked })} className="rounded text-slate-600" />
                  <span className="text-sm text-slate-600">Obesidad</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={comorbidities.venousInsufficiency} onChange={e => setComorbidities({ ...comorbidities, venousInsufficiency: e.target.checked })} className="rounded text-slate-600" />
                  <span className="text-sm text-slate-600">Insuf. Venosa</span>
                </label>
              </div>
            </div>
            <button onClick={submitProfile} disabled={createTest.isPending} className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white py-2.5 rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-60">
              {profileSaved ? <CheckCircle size={16} /> : <Droplets size={16} />}
              {profileSaved ? 'Guardado' : 'Guardar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 2: EVALUACIÓN ════════════════════ */}
      {tab === 'evaluacion' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => { setShowEvalForm(!showEvalForm); resetEvalForm() }} className="flex items-center gap-1.5 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg border border-teal-200 transition-colors">
              <Plus size={14} /> Nueva Evaluación
            </button>
          </div>

          {showEvalForm && (
            <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm space-y-6">
              {/* Mode + side selectors */}
              <div className="flex gap-8 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Protocolo</p>
                  <div className="flex gap-2">
                    {([
                      { v: 'isl', label: 'ISL Estándar (6 pt.)', sub: 'Kayıran et al. 2017' },
                      { v: 'ow',  label: 'Oncowellness (5 cm)', sub: 'Alta resolución' },
                    ] as { v: EvalMode; label: string; sub: string }[]).map(m => (
                      <button key={m.v} onClick={() => { setEvalMode(m.v); resetEvalForm() }}
                        className={cn('px-4 py-2 rounded-lg border text-left transition-colors', evalMode === m.v ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300')}>
                        <p className="text-sm font-semibold">{m.label}</p>
                        <p className={cn('text-[10px]', evalMode === m.v ? 'text-teal-100' : 'text-slate-400')}>{m.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Lado Afecto</p>
                  <div className="flex gap-2">
                    {(['left', 'right'] as LimbSide[]).map(s => (
                      <button key={s} onClick={() => setSide(s)} className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors', side === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300')}>
                        {s === 'left' ? 'Izquierdo' : 'Derecho'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Volume alerts (live) */}
              {(evalAlertDiff || evalAlertExcess) && evalVolumes.aff.total > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {evalAlertDiff && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} className="text-red-600 shrink-0" />
                      <p className="text-sm font-semibold text-red-700">Diferencia &gt;200 mL ({evalVolumes.diff.toFixed(0)} mL)</p>
                    </div>
                  )}
                  {evalAlertExcess && (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <AlertCircle size={14} className="text-orange-600 shrink-0" />
                      <p className="text-sm font-semibold text-orange-700">Exceso &gt;10% ({evalVolumes.pct.toFixed(1)}%)</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mirror input */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mediciones Circunferenciales (cm)</p>
                  {evalVolumes.aff.total > 0 && (
                    <div className="flex gap-4 text-xs">
                      <span className="text-teal-600 font-semibold">Afecto: {evalVolumes.aff.total.toFixed(0)} mL</span>
                      <span className="text-slate-500">Contralateral: {evalVolumes.con.total.toFixed(0)} mL</span>
                      <span className={cn('font-bold', evalVolumes.diff > 200 ? 'text-red-600' : evalVolumes.pct > 10 ? 'text-orange-600' : 'text-green-600')}>
                        Δ {evalVolumes.diff > 0 ? '+' : ''}{evalVolumes.diff.toFixed(0)} mL ({evalVolumes.pct > 0 ? '+' : ''}{evalVolumes.pct.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                {evalMode === 'ow' && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Circunferencias de dedos (referencia, no incluidas en volumen)</p>
                    <MirrorInput
                      points={OW_FINGER_POINTS}
                      affected={affMeas} contralateral={conMeas}
                      onAffected={(k, v) => setAffMeas(p => ({ ...p, [k]: v }))}
                      onContralateral={(k, v) => setConMeas(p => ({ ...p, [k]: v }))}
                    />
                    <p className="text-xs font-semibold text-slate-600 mt-4 mb-2">Segmentos volumétricos (muñeca → m10, cada 5 cm)</p>
                  </div>
                )}

                <MirrorInput
                  points={evalMode === 'isl' ? ISL_POINTS : OW_VOL_POINTS}
                  affected={affMeas} contralateral={conMeas}
                  onAffected={(k, v) => setAffMeas(p => ({ ...p, [k]: v }))}
                  onContralateral={(k, v) => setConMeas(p => ({ ...p, [k]: v }))}
                  segExcesses={evalVolumes.aff.segs.length > 0 ? evalVolumes.segExcesses : undefined}
                />
              </div>

              {/* Stemmer, Pitting, ISL Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
                {/* Stemmer */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Signo de Stemmer</p>
                  <div className="flex gap-2">
                    <button onClick={() => setStemmer(false)} className={cn('flex-1 py-1.5 text-sm rounded-lg border transition-colors', !stemmer ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200')}>Negativo</button>
                    <button onClick={() => setStemmer(true)} className={cn('flex-1 py-1.5 text-sm rounded-lg border transition-colors', stemmer ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200')}>Positivo</button>
                  </div>
                </div>
                {/* Pitting */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Test de Fóvea</p>
                  <div className="flex gap-1 flex-wrap">
                    {PITTING_GRADES.map(g => (
                      <button key={g.v} onClick={() => setPitting(g.v)} className={cn('px-2.5 py-1 text-xs rounded-lg border transition-colors', pitting === g.v ? (g.v === 0 ? 'bg-green-600 text-white border-green-600' : 'bg-orange-500 text-white border-orange-500') : 'bg-white text-slate-600 border-slate-200')}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* ISL Stage */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                    Estadio ISL
                    <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded font-normal">Sugerido: {suggestedStage}</span>
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {ISL_STAGE_INFO.map(st => (
                      <button key={st.value} title={st.desc} onClick={() => { setIslStage(st.value); setStageOverridden(st.value !== suggestedStage) }}
                        className={cn('px-2.5 py-1 text-xs rounded-lg border transition-colors', islStage === st.value ? cn(st.bg, st.color, 'border-current font-semibold') : 'bg-white text-slate-600 border-slate-200')}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{ISL_STAGE_INFO.find(s => s.value === islStage)?.desc}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={submitEval} disabled={createTest.isPending || evalVolumes.aff.total === 0} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm">
                  <CheckCircle size={15} /> Guardar Evaluación
                </button>
                <button onClick={() => setShowEvalForm(false)} className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </div>
          )}

          {/* Latest eval summary */}
          {latestEvalJson && !showEvalForm && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Última Evaluación</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{latestEvalJson.mode === 'isl' ? 'ISL Estándar' : 'Oncowellness'}</span>
                  <span className="text-xs text-slate-400">{formatDate(latestEval?.created_at)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-teal-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Afecto</p>
                  <p className="text-lg font-bold text-teal-700">{(latestEvalJson.volAffected ?? 0).toFixed(0)} mL</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Contralateral</p>
                  <p className="text-lg font-bold text-slate-700">{(latestEvalJson.volContralateral ?? 0).toFixed(0)} mL</p>
                </div>
                <div className={cn('text-center p-3 rounded-lg', (latestEval?.valor_numerico ?? 0) > 200 ? 'bg-red-50' : (latestEvalJson.pctExcess ?? 0) > 10 ? 'bg-orange-50' : 'bg-green-50')}>
                  <p className="text-xs text-slate-500 mb-1">Diferencia</p>
                  <p className={cn('text-lg font-bold', (latestEval?.valor_numerico ?? 0) > 200 ? 'text-red-700' : (latestEvalJson.pctExcess ?? 0) > 10 ? 'text-orange-700' : 'text-green-700')}>
                    {(latestEval?.valor_numerico ?? 0) > 0 ? '+' : ''}{(latestEval?.valor_numerico ?? 0).toFixed(0)} mL
                  </p>
                  <p className="text-[10px] text-slate-500">{(latestEvalJson.pctExcess ?? 0) > 0 ? '+' : ''}{(latestEvalJson.pctExcess ?? 0).toFixed(1)}%</p>
                </div>
                <div className={cn('text-center p-3 rounded-lg', ISL_STAGE_INFO.find(s => s.value === latestEvalJson.islStage)?.bg)}>
                  <p className="text-xs text-slate-500 mb-1">Estadio ISL</p>
                  <p className={cn('text-lg font-bold', ISL_STAGE_INFO.find(s => s.value === latestEvalJson.islStage)?.color)}>
                    {latestEvalJson.islStage === '0' ? 'Est. 0' : `Est. ${latestEvalJson.islStage}`}
                  </p>
                  <p className="text-[10px] text-slate-500">{latestEvalJson.stemmer ? 'Stemmer +' : ''}{latestEvalJson.pitting > 0 ? ` Fóvea ${latestEvalJson.pitting}+` : ''}</p>
                </div>
              </div>
            </div>
          )}

          {evalTests.length === 0 && !showEvalForm && (
            <div className="text-center py-12 text-slate-400 text-sm">Sin evaluaciones. Pulsa "Nueva Evaluación" para comenzar.</div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 3: TRATAMIENTO ════════════════════ */}
      {tab === 'tratamiento' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setShowTreatForm(!showTreatForm)} className="flex items-center gap-1.5 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg border border-teal-200 transition-colors">
              <Plus size={14} /> Registrar Sesión
            </button>
          </div>

          {showTreatForm && (
            <div className="bg-white border border-teal-200 rounded-xl p-5 shadow-sm space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha</label>
                <input type="date" value={treatDate} onChange={e => setTreatDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* DLM */}
                <div className={cn('p-4 rounded-xl border transition-colors', dlm ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-slate-50')}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" checked={dlm} onChange={e => setDlm(e.target.checked)} className="rounded text-teal-600" />
                    <span className="text-sm font-semibold text-slate-700">Drenaje Linfático Manual</span>
                  </label>
                  {dlm && (
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Duración (min)</label>
                      <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white" placeholder="45" value={dlmMins} onChange={e => setDlmMins(e.target.value)} />
                    </div>
                  )}
                </div>

                {/* Vendaje */}
                <div className={cn('p-4 rounded-xl border transition-colors', bandage ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50')}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" checked={bandage} onChange={e => setBandage(e.target.checked)} className="rounded text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Vendaje Multicapa</span>
                  </label>
                  {bandage && (
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Días aplicado</label>
                      <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" placeholder="2" value={bandageDays} onChange={e => setBandageDays(e.target.value)} />
                    </div>
                  )}
                </div>

                {/* Prenda */}
                <div className={cn('p-4 rounded-xl border transition-colors', garment ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-slate-50')}>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" checked={garment} onChange={e => setGarment(e.target.checked)} className="rounded text-purple-600" />
                    <span className="text-sm font-semibold text-slate-700">Prenda de Compresión</span>
                  </label>
                  {garment && (
                    <div className="space-y-2">
                      <select value={garmentType} onChange={e => setGarmentType(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
                        <option value="sleeve">Manga</option>
                        <option value="glove">Guante</option>
                        <option value="both">Manga + Guante</option>
                      </select>
                      <select value={garmentClass} onChange={e => setGarmentClass(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
                        <option value="I">Clase I (18-21 mmHg)</option>
                        <option value="II">Clase II (23-32 mmHg)</option>
                        <option value="III">Clase III (34-46 mmHg)</option>
                        <option value="IV">Clase IV (&gt;49 mmHg)</option>
                      </select>
                      <input type="number" placeholder="mmHg exactos (opcional)" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white" value={garmentMmhg} onChange={e => setGarmentMmhg(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={submitTreatment} disabled={createTest.isPending || (!dlm && !bandage && !garment)} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm">
                  <CheckCircle size={15} /> Guardar Sesión
                </button>
                <button onClick={() => setShowTreatForm(false)} className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </div>
          )}

          {/* Treatment history */}
          {treatmentTests.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Historial de Sesiones</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">Fecha</th>
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">DLM</th>
                      <th className="text-left text-slate-500 py-2 pr-4 font-medium">Vendaje</th>
                      <th className="text-left text-slate-500 py-2 font-medium">Prenda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...treatmentTests].reverse().map(t => {
                      const j = t.valores_json as any
                      return (
                        <tr key={t.id} className="border-b border-slate-50">
                          <td className="py-2 pr-4 text-slate-600">{j?.date ?? formatDate(t.created_at)}</td>
                          <td className="py-2 pr-4">{j?.dlm ? <span className="text-teal-700 font-medium">{j.dlmMins ? `${j.dlmMins} min` : '✓'}</span> : <span className="text-slate-300">—</span>}</td>
                          <td className="py-2 pr-4">{j?.bandage ? <span className="text-blue-700 font-medium">{j.bandageDays ? `${j.bandageDays} días` : '✓'}</span> : <span className="text-slate-300">—</span>}</td>
                          <td className="py-2">{j?.garment ? <span className="text-purple-700 font-medium">Clase {j.garmentClass} {j.garmentType === 'sleeve' ? 'Manga' : j.garmentType === 'glove' ? 'Guante' : 'Manga+Guante'}{j.garmentMmhg ? ` · ${j.garmentMmhg} mmHg` : ''}</span> : <span className="text-slate-300">—</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {treatmentTests.length === 0 && !showTreatForm && (
            <div className="text-center py-12 text-slate-400 text-sm">Sin sesiones registradas. Pulsa "Registrar Sesión" para comenzar.</div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 4: EVOLUCIÓN ════════════════════ */}
      {tab === 'evolucion' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Evaluaciones</p>
              <p className="text-2xl font-bold text-teal-600">{evalTests.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Última diferencia</p>
              <p className={cn('text-2xl font-bold', !latestEval ? 'text-slate-300' : (latestEval.valor_numerico ?? 0) > 200 ? 'text-red-600' : (latestEvalJson?.pctExcess ?? 0) > 10 ? 'text-orange-600' : 'text-green-600')}>
                {latestEval ? `${(latestEval.valor_numerico ?? 0) > 0 ? '+' : ''}${(latestEval.valor_numerico ?? 0).toFixed(0)} mL` : 'N/D'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Estadio ISL</p>
              <p className={cn('text-2xl font-bold', ISL_STAGE_INFO.find(s => s.value === (latestEvalJson?.islStage ?? '0'))?.color ?? 'text-slate-300')}>
                {latestEvalJson ? `Est. ${latestEvalJson.islStage}` : 'N/D'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Tendencia (mL)</p>
              <div className="mt-1">
                {evalTests.length >= 2
                  ? <DeltaBadge current={evalTests[evalTests.length - 1]?.valor_numerico ?? 0} prev={evalTests[evalTests.length - 2]?.valor_numerico ?? 0} />
                  : <span className="text-slate-300 text-sm">N/D</span>}
              </div>
            </div>
          </div>

          {/* Bilateral longitudinal chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolución Volumétrica Bilateral (mL)</h3>
            {evolutionData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" mL" />
                  <Tooltip formatter={(v: any) => [`${v} mL`]} />
                  <Legend />
                  <Line type="monotone" dataKey="Afecto (mL)" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488', r: 4 }} />
                  <Line type="monotone" dataKey="Contralateral (mL)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#94a3b8', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Se necesitan al menos 2 evaluaciones.</div>
            )}
          </div>

          {/* % Reduction per visit */}
          {evalTests.length >= 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">% Reducción por Visita (vs. anterior)</h3>
              <div className="space-y-2">
                {evalTests.slice(1).map((t, i) => {
                  const prev = evalTests[i]
                  const change = (t.valor_numerico ?? 0) - (prev.valor_numerico ?? 0)
                  const pctChange = (prev.valor_numerico ?? 0) !== 0 ? (change / Math.abs(prev.valor_numerico ?? 1)) * 100 : 0
                  const improved = change < 0
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-20 shrink-0">{formatDate(t.created_at)}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', improved ? 'bg-green-400' : 'bg-red-400')}
                          style={{ width: `${Math.min(100, Math.abs(pctChange))}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-semibold w-14 text-right', improved ? 'text-green-600' : 'text-red-600')}>
                        {improved ? '' : '+'}{pctChange.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Segmental heat map (OW mode only) */}
          {heatmapSegs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Mapa de Calor Segmentario</h3>
              <p className="text-xs text-slate-400 mb-4">Última evaluación Oncowellness · % exceso por segmento vs. contralateral</p>
              <div className="flex gap-6 items-start">
                {/* Visual arm */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400 mb-1">Hombro</span>
                  {[...heatmapSegs].reverse().map((excess, i) => {
                    const segIdx = heatmapSegs.length - 1 - i
                    const pt = OW_VOL_POINTS[segIdx + 1]
                    const col = segColor(excess)
                    const width = 32 + (heatmapSegs.length - 1 - i) * 4 // taper toward wrist
                    return (
                      <div
                        key={segIdx}
                        title={`${pt?.label}: ${excess > 0 ? '+' : ''}${excess.toFixed(1)}%`}
                        className={cn('rounded flex items-center justify-center text-[10px] font-semibold transition-colors', col.bar, col.text)}
                        style={{ width: `${width}px`, height: '20px' }}
                      >
                        {excess > 0 ? '+' : ''}{excess.toFixed(0)}%
                      </div>
                    )
                  })}
                  <span className="text-[10px] text-slate-400 mt-1">Muñeca</span>
                </div>
                {/* Legend + table */}
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Normal (<5%)',     bar: 'bg-green-200',  text: 'text-green-700' },
                      { label: 'Leve (5-10%)',     bar: 'bg-yellow-200', text: 'text-yellow-700' },
                      { label: 'Moderado (10-20%)', bar: 'bg-orange-200', text: 'text-orange-700' },
                      { label: 'Severo (>20%)',    bar: 'bg-red-200',    text: 'text-red-700' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className={cn('w-3 h-3 rounded', l.bar)} />
                        <span className={cn('text-[10px]', l.text)}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-100"><th className="text-left text-slate-500 py-1 pr-4 font-medium">Segmento</th><th className="text-left text-slate-500 py-1 font-medium">Exceso</th></tr></thead>
                      <tbody>
                        {heatmapSegs.map((excess, i) => {
                          const pt = OW_VOL_POINTS[i + 1]
                          const col = segColor(excess)
                          return (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-1 pr-4 text-slate-600">{OW_VOL_POINTS[i].label} → {pt?.label}</td>
                              <td className="py-1"><span className={cn('font-semibold px-1.5 py-0.5 rounded text-[10px]', col.bar, col.text)}>{excess > 0 ? '+' : ''}{excess.toFixed(1)}%</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {evalTests.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">Sin datos de evolución. Registra evaluaciones en la pestaña anterior.</div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 5: EXPORTACIÓN ════════════════════ */}
      {tab === 'exportacion' && (
        <div className="space-y-5">
          {/* LYMQOL */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-slate-700">LYMQOL-UL — Puntuaciones por Dominio</h3>
              <span className="text-xs text-slate-400 ml-1">(administrar cuestionario en papel, registrar totales aquí)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {([
                { key: 'symptoms',   label: 'Síntomas',  max: '10' },
                { key: 'func',       label: 'Función',   max: '15' },
                { key: 'appearance', label: 'Apariencia', max: '2' },
                { key: 'mood',       label: 'Estado Emocional', max: '10' },
              ] as { key: keyof typeof lymqol; label: string; max: string }[]).map(d => (
                <div key={d.key}>
                  <label className="text-xs font-medium text-slate-500 block mb-1">{d.label} <span className="text-slate-300">(0–{d.max})</span></label>
                  <input
                    type="number" min="0" max={d.max} step="1"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    placeholder="—"
                    value={lymqol[d.key]}
                    onChange={e => setLymqol(p => ({ ...p, [d.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveLymqol} disabled={createTest.isPending} className="mt-4 flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm disabled:opacity-60">
              {lymqolSaved ? <CheckCircle size={15} /> : <ClipboardList size={15} />}
              {lymqolSaved ? 'Guardado' : 'Guardar LYMQOL'}
            </button>
          </div>

          {/* Export CSV */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileDown size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-slate-700">Exportar para Investigación</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Genera un CSV anonimizado (ID = primeros 8 caracteres del UUID). Incluye todas las evaluaciones con puntos de medida, volúmenes, estadio ISL, IMC y signos clínicos. Compatible con SPSS/R/Python.
            </p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-4">
              <div className="text-xs text-slate-600 space-y-0.5">
                <p><span className="font-medium">{evalTests.length}</span> evaluaciones · <span className="font-medium">{profileTests.length}</span> perfiles · <span className="font-medium">{treatmentTests.length}</span> sesiones de tratamiento</p>
                <p className="text-slate-400">ID anonimizado: <code className="bg-white px-1 rounded">{selectedPatientId?.slice(0, 8).toUpperCase() ?? '—'}</code></p>
              </div>
            </div>
            <button
              onClick={() => selectedPatientId && exportCSV(evalTests, profileTests, selectedPatientId)}
              disabled={evalTests.length === 0}
              className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
            >
              <FileDown size={16} /> Exportar CSV Anonimizado
            </button>
          </div>

          {/* Compression garment quick reference */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shirt size={15} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-600">Referencia Clases de Compresión</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { clase: 'I',   mmhg: '18–21 mmHg', uso: 'Linfedema leve / prevención' },
                { clase: 'II',  mmhg: '23–32 mmHg', uso: 'Linfedema moderado (más frecuente)' },
                { clase: 'III', mmhg: '34–46 mmHg', uso: 'Linfedema severo' },
                { clase: 'IV',  mmhg: '≥49 mmHg',   uso: 'Linfedema muy severo / elefantiasis' },
              ].map(c => (
                <div key={c.clase} className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-sm font-bold text-teal-700 mb-0.5">Clase {c.clase}</p>
                  <p className="text-xs font-medium text-slate-600">{c.mmhg}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{c.uso}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
