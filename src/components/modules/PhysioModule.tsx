import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Minus, Plus, CheckCircle, AlertTriangle, AlertCircle, Shield } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useClinicalTests, useCreateClinicalTest } from '@/hooks/useClinicalTests'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '../../lib/utils'

function DeltaBadge({ current, baseline }: { current: number; baseline: number }) {
  const delta = current - baseline
  if (delta > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />+{delta.toFixed(1)}</span>
  if (delta < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown size={12} />{delta.toFixed(1)}</span>
  return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus size={12} />0</span>
}

export function PhysioModule() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: clinicalTests = [] } = useClinicalTests(selectedPatientId)
  const createTest = useCreateClinicalTest()
  const { user } = useAuth()

  const [showHandgripForm, setShowHandgripForm] = useState(false)
  const [showSixMWTForm, setShowSixMWTForm] = useState(false)
  const [showSTSForm, setShowSTSForm] = useState(false)
  const [showTUGForm, setShowTUGForm] = useState(false)

  const [hgDom, setHgDom] = useState('')
  const [hgNonDom, setHgNonDom] = useState('')
  const [hgDate, setHgDate] = useState(new Date().toISOString().split('T')[0])

  const [mwtDist, setMwtDist] = useState('')
  const [mwtHR, setMwtHR] = useState('')
  const [mwtFatigue, setMwtFatigue] = useState('')
  const [mwtDate, setMwtDate] = useState(new Date().toISOString().split('T')[0])

  const [stsReps, setStsReps] = useState('')
  const [stsDate, setStsDate] = useState(new Date().toISOString().split('T')[0])
  const [stsBaseline, setStsBaseline] = useState(false)

  const [tugSecs, setTugSecs] = useState('')
  const [tugDate, setTugDate] = useState(new Date().toISOString().split('T')[0])
  const [tugBaseline, setTugBaseline] = useState(false)

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  // Group tests by type
  const handgripTests = clinicalTests.filter(t => t.tipo === 'Handgrip')
  const sixMWTTests = clinicalTests.filter(t => t.tipo === '6MWT')
  const stsTests = clinicalTests.filter(t => t.tipo === '30STS')
  const tugTests = clinicalTests.filter(t => t.tipo === 'TUG')

  const latestHandgrip = handgripTests[handgripTests.length - 1]
  const baselineHandgrip = handgripTests.find(h => h.is_baseline)
  const latestSixMWT = sixMWTTests[sixMWTTests.length - 1]
  const baselineSixMWT = sixMWTTests.find(s => s.is_baseline)
  const latestSTS = stsTests[stsTests.length - 1]
  const latestTUG = tugTests[tugTests.length - 1]

  const getVal = (t: any) => t?.valor_numerico ?? 0
  const getJson = (t: any) => (t?.valores_json ?? {}) as any

  // Radar data
  const radarData = [
    { domain: 'Fuerza', actual: latestHandgrip ? Math.min(100, (getVal(latestHandgrip) / 50) * 100) : 0, basal: baselineHandgrip ? Math.min(100, (getVal(baselineHandgrip) / 50) * 100) : 0 },
    { domain: 'Resistencia', actual: latestSixMWT ? Math.min(100, (getVal(latestSixMWT) / 600) * 100) : 0, basal: baselineSixMWT ? Math.min(100, (getVal(baselineSixMWT) / 600) * 100) : 0 },
    { domain: 'Fuerza MMII', actual: latestSTS ? Math.min(100, (getVal(latestSTS) / 20) * 100) : 0, basal: 0 },
    { domain: 'Agilidad', actual: latestTUG ? Math.max(0, ((20 - getVal(latestTUG)) / 15) * 100) : 0, basal: 0 },
  ]

  const handgripData = handgripTests.map(h => ({
    date: formatDate(h.created_at),
    Dominante: getVal(h),
    'No Dominante': getJson(h).nonDominantHand ?? 0,
  }))

  const sixMWTData = sixMWTTests.map(s => ({
    date: formatDate(s.created_at),
    'Distancia (m)': getVal(s),
  }))

  function submitHandgrip() {
    if (!hgDom || !hgNonDom || !selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'Handgrip',
      valor_numerico: parseFloat(hgDom),
      valores_json: { nonDominantHand: parseFloat(hgNonDom), date: hgDate },
      is_baseline: handgripTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowHandgripForm(false); setHgDom(''); setHgNonDom('')
  }

  function submitSixMWT() {
    if (!mwtDist || !selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: '6MWT',
      valor_numerico: parseInt(mwtDist),
      valores_json: { heartRatePeak: mwtHR ? parseInt(mwtHR) : null, fatigue: mwtFatigue ? parseInt(mwtFatigue) : null, date: mwtDate },
      is_baseline: sixMWTTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowSixMWTForm(false); setMwtDist(''); setMwtHR(''); setMwtFatigue('')
  }

  function submitSTS() {
    if (!stsReps || !selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: '30STS',
      valor_numerico: parseInt(stsReps),
      valores_json: { date: stsDate },
      is_baseline: stsBaseline || stsTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowSTSForm(false); setStsReps(''); setStsBaseline(false)
  }

  function submitTUG() {
    if (!tugSecs || !selectedPatientId) return
    createTest.mutate({
      patient_id: selectedPatientId,
      tipo: 'TUG',
      valor_numerico: parseFloat(tugSecs),
      valores_json: { date: tugDate },
      is_baseline: tugBaseline || tugTests.length === 0,
      staff_id: user?.id ?? null,
    })
    setShowTUGForm(false); setTugSecs(''); setTugBaseline(false)
  }

  const tugAlert = latestTUG && getVal(latestTUG) > 12

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
          <Activity size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Dashboard de Recuperación Funcional</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.nombre}</p>
        </div>
      </div>

      {tugAlert && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700"><span className="font-semibold">Alto Riesgo de Caída</span> — TUG {getVal(latestTUG)}s &gt; 12s.</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Basal</p>
          <p className="text-2xl font-bold text-blue-600">{baselineHandgrip ? `${getVal(baselineHandgrip)} kg` : 'N/D'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Actual</p>
          <p className="text-2xl font-bold text-slate-800">{latestHandgrip ? `${getVal(latestHandgrip)} kg` : 'N/D'}</p>
          {baselineHandgrip && latestHandgrip && latestHandgrip !== baselineHandgrip && <DeltaBadge current={getVal(latestHandgrip)} baseline={getVal(baselineHandgrip)} />}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Basal</p>
          <p className="text-2xl font-bold text-blue-600">{baselineSixMWT ? `${getVal(baselineSixMWT)} m` : 'N/D'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Actual</p>
          <p className="text-2xl font-bold text-slate-800">{latestSixMWT ? `${getVal(latestSixMWT)} m` : 'N/D'}</p>
          {baselineSixMWT && latestSixMWT && latestSixMWT !== baselineSixMWT && <DeltaBadge current={getVal(latestSixMWT)} baseline={getVal(baselineSixMWT)} />}
        </div>
      </div>

      {/* Radar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Perfil Funcional Integral</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
            <Radar name="Actual" dataKey="actual" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
            <Radar name="Basal" dataKey="basal" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeDasharray="4 4" />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Handgrip chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Fuerza de Prensión (Handgrip)</h3>
          <button onClick={() => setShowHandgripForm(!showHandgripForm)} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
            <Plus size={12} /> Registrar
          </button>
        </div>
        {showHandgripForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-end gap-3 flex-wrap">
            <div><label className="text-xs text-slate-600 block mb-1">Fecha</label><input type="date" value={hgDate} onChange={e => setHgDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">Dominante (kg) *</label><input type="number" step="0.1" value={hgDom} onChange={e => setHgDom(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">No Dominante (kg) *</label><input type="number" step="0.1" value={hgNonDom} onChange={e => setHgNonDom(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
            <button onClick={submitHandgrip} disabled={createTest.isPending} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"><CheckCircle size={14} /> Guardar</button>
          </div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={handgripData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Dominante" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            <Line type="monotone" dataKey="No Dominante" stroke="#93c5fd" strokeWidth={2} dot={{ fill: '#93c5fd', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 6MWT chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Test de Marcha (6MWT)</h3>
          <button onClick={() => setShowSixMWTForm(!showSixMWTForm)} className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-1.5 rounded-lg">
            <Plus size={12} /> Registrar
          </button>
        </div>
        {showSixMWTForm && (
          <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-100 flex items-end gap-3 flex-wrap">
            <div><label className="text-xs text-slate-600 block mb-1">Fecha</label><input type="date" value={mwtDate} onChange={e => setMwtDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">Distancia (m) *</label><input type="number" value={mwtDist} onChange={e => setMwtDist(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">FC Pico</label><input type="number" value={mwtHR} onChange={e => setMwtHR(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" /></div>
            <button onClick={submitSixMWT} disabled={createTest.isPending} className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-60"><CheckCircle size={14} /> Guardar</button>
          </div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sixMWTData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="Distancia (m)" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 30STS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Test 30STS</h3>
          <button onClick={() => setShowSTSForm(!showSTSForm)} className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg"><Plus size={12} /> Registrar</button>
        </div>
        {showSTSForm && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-end gap-3 flex-wrap">
            <div><label className="text-xs text-slate-600 block mb-1">Fecha</label><input type="date" value={stsDate} onChange={e => setStsDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">Repeticiones *</label><input type="number" value={stsReps} onChange={e => setStsReps(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={stsBaseline} onChange={e => setStsBaseline(e.target.checked)} className="rounded" />Basal</label>
            <button onClick={submitSTS} disabled={createTest.isPending} className="flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-60"><CheckCircle size={14} /> Guardar</button>
          </div>
        )}
        {stsTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100"><th className="text-left text-slate-500 py-2 pr-4">Fecha</th><th className="text-left text-slate-500 py-2">Reps</th></tr></thead>
              <tbody>{stsTests.map(s => <tr key={s.id} className="border-b border-slate-50"><td className="py-1.5 pr-4 text-slate-600">{formatDate(s.created_at)}</td><td className="py-1.5 font-medium text-slate-800">{s.valor_numerico}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-xs text-slate-400">Sin registros.</p>}
      </div>

      {/* TUG */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Timed Up and Go (TUG)</h3>
          <button onClick={() => setShowTUGForm(!showTUGForm)} className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg"><Plus size={12} /> Registrar</button>
        </div>
        {showTUGForm && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-end gap-3 flex-wrap">
            <div><label className="text-xs text-slate-600 block mb-1">Fecha</label><input type="date" value={tugDate} onChange={e => setTugDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
            <div><label className="text-xs text-slate-600 block mb-1">Tiempo (s) *</label><input type="number" step="0.1" value={tugSecs} onChange={e => setTugSecs(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-orange-400" /></div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={tugBaseline} onChange={e => setTugBaseline(e.target.checked)} className="rounded" />Basal</label>
            <button onClick={submitTUG} disabled={createTest.isPending} className="flex items-center gap-1.5 text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-60"><CheckCircle size={14} /> Guardar</button>
          </div>
        )}
        {tugTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100"><th className="text-left text-slate-500 py-2 pr-4">Fecha</th><th className="text-left text-slate-500 py-2 pr-4">Tiempo</th><th className="text-left text-slate-500 py-2">Riesgo</th></tr></thead>
              <tbody>{tugTests.map(t => <tr key={t.id} className="border-b border-slate-50"><td className="py-1.5 pr-4 text-slate-600">{formatDate(t.created_at)}</td><td className={`py-1.5 pr-4 font-medium ${(t.valor_numerico ?? 0) > 12 ? 'text-red-600' : 'text-slate-800'}`}>{t.valor_numerico}s</td><td className="py-1.5"><span className={`text-xs font-medium ${(t.valor_numerico ?? 0) > 12 ? 'text-red-600' : 'text-green-600'}`}>{(t.valor_numerico ?? 0) > 12 ? 'Alto' : 'Normal'}</span></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="text-xs text-slate-400">Sin registros.</p>}
      </div>
    </div>
  )
}
