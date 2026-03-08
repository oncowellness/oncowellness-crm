import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Minus, Plus, CheckCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatDate } from '../../lib/utils'
import type { Patient } from '../../types'

interface Props {
  patient?: Patient
}

function DeltaBadge({ current, baseline }: { current: number; baseline: number }) {
  const delta = current - baseline
  if (delta > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />+{delta.toFixed(1)}</span>
  if (delta < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown size={12} />{delta.toFixed(1)}</span>
  return <span className="text-xs text-slate-400 flex items-center gap-0.5"><Minus size={12} />0</span>
}

export function PhysioModule({ patient: propPatient }: Props) {
  const { patients, selectedPatientId, addHandgrip, addSixMWT } = useStore()

  // If a patient is passed as prop, use it; else use selected from store; else use first patient
  const patient = propPatient ?? patients.find(p => p.id === selectedPatientId) ?? patients[0]

  const [showHandgripForm, setShowHandgripForm] = useState(false)
  const [showSixMWTForm, setShowSixMWTForm] = useState(false)

  // Handgrip form state
  const [hgDom, setHgDom] = useState('')
  const [hgNonDom, setHgNonDom] = useState('')
  const [hgDate, setHgDate] = useState(new Date().toISOString().split('T')[0])

  // 6MWT form state
  const [mwtDist, setMwtDist] = useState('')
  const [mwtHR, setMwtHR] = useState('')
  const [mwtFatigue, setMwtFatigue] = useState('')
  const [mwtDate, setMwtDate] = useState(new Date().toISOString().split('T')[0])

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  const baselineHandgrip = patient.handgrip.find(h => h.isBaseline)
  const latestHandgrip = patient.handgrip[patient.handgrip.length - 1]
  const baselineSixMWT = patient.sixMWT.find(s => s.isBaseline)
  const latestSixMWT = patient.sixMWT[patient.sixMWT.length - 1]

  // Chart data
  const handgripData = patient.handgrip.map(h => ({
    date: formatDate(h.date),
    Dominante: h.dominantHand,
    'No Dominante': h.nonDominantHand,
    isBaseline: h.isBaseline,
  }))

  const sixMWTData = patient.sixMWT.map(s => ({
    date: formatDate(s.date),
    'Distancia (m)': s.distanceMeters,
    'FC Pico': s.heartRatePeak ?? 0,
    'Fatiga Borg': (s.fatigue ?? 0) * 10, // scale for visibility
    isBaseline: s.isBaseline,
  }))

  function submitHandgrip() {
    if (!hgDom || !hgNonDom) return
    addHandgrip(patient.id, {
      date: hgDate,
      dominantHand: parseFloat(hgDom),
      nonDominantHand: parseFloat(hgNonDom),
    })
    setShowHandgripForm(false)
    setHgDom(''); setHgNonDom('')
  }

  function submitSixMWT() {
    if (!mwtDist) return
    addSixMWT(patient.id, {
      date: mwtDate,
      distanceMeters: parseInt(mwtDist),
      heartRatePeak: mwtHR ? parseInt(mwtHR) : undefined,
      fatigue: mwtFatigue ? parseInt(mwtFatigue) : undefined,
    })
    setShowSixMWTForm(false)
    setMwtDist(''); setMwtHR(''); setMwtFatigue('')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Dashboard de Recuperación Funcional</h2>
            <p className="text-xs text-slate-500">Paciente: {patient.name}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Basal (dom.)</p>
          <p className="text-2xl font-bold text-blue-600">{baselineHandgrip ? `${baselineHandgrip.dominantHand} kg` : 'N/D'}</p>
          <p className="text-xs text-slate-400 mt-1">Valor de referencia</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Handgrip Actual (dom.)</p>
          <p className="text-2xl font-bold text-slate-800">{latestHandgrip ? `${latestHandgrip.dominantHand} kg` : 'N/D'}</p>
          {baselineHandgrip && latestHandgrip && latestHandgrip !== baselineHandgrip && (
            <DeltaBadge current={latestHandgrip.dominantHand} baseline={baselineHandgrip.dominantHand} />
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Basal</p>
          <p className="text-2xl font-bold text-blue-600">{baselineSixMWT ? `${baselineSixMWT.distanceMeters} m` : 'N/D'}</p>
          <p className="text-xs text-slate-400 mt-1">Valor de referencia</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">6MWT Actual</p>
          <p className="text-2xl font-bold text-slate-800">{latestSixMWT ? `${latestSixMWT.distanceMeters} m` : 'N/D'}</p>
          {baselineSixMWT && latestSixMWT && latestSixMWT !== baselineSixMWT && (
            <DeltaBadge current={latestSixMWT.distanceMeters} baseline={baselineSixMWT.distanceMeters} />
          )}
        </div>
      </div>

      {/* Handgrip chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Fuerza de Prensión (Handgrip)</h3>
          <button
            onClick={() => setShowHandgripForm(!showHandgripForm)}
            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showHandgripForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={hgDate} onChange={e => setHgDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Mano Dominante (kg) *</label>
              <input type="number" step="0.1" value={hgDom} onChange={e => setHgDom(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Mano No Dominante (kg) *</label>
              <input type="number" step="0.1" value={hgNonDom} onChange={e => setHgNonDom(e.target.value)} placeholder="0.0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button onClick={submitHandgrip}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={handgripData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip />
            <Legend />
            {baselineHandgrip && (
              <ReferenceLine y={baselineHandgrip.dominantHand} stroke="#93c5fd" strokeDasharray="4 4"
                label={{ value: 'Basal', fill: '#93c5fd', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="Dominante" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            <Line type="monotone" dataKey="No Dominante" stroke="#93c5fd" strokeWidth={2} dot={{ fill: '#93c5fd', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 6MWT chart + form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Evolución Test de Marcha (6MWT)</h3>
          <button
            onClick={() => setShowSixMWTForm(!showSixMWTForm)}
            className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-600 hover:bg-teal-100 px-3 py-1.5 rounded-lg"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>

        {showSixMWTForm && (
          <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-100 flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fecha</label>
              <input type="date" value={mwtDate} onChange={e => setMwtDate(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Distancia (m) *</label>
              <input type="number" value={mwtDist} onChange={e => setMwtDist(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">FC Pico (bpm)</label>
              <input type="number" value={mwtHR} onChange={e => setMwtHR(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Fatiga Borg (0–10)</label>
              <input type="number" min="0" max="10" value={mwtFatigue} onChange={e => setMwtFatigue(e.target.value)} placeholder="0"
                className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <button onClick={submitSixMWT}
              className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700">
              <CheckCircle size={14} /> Guardar
            </button>
          </div>
        )}

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sixMWTData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {baselineSixMWT && (
              <ReferenceLine y={baselineSixMWT.distanceMeters} stroke="#6ee7b7" strokeDasharray="4 4"
                label={{ value: 'Basal', fill: '#6ee7b7', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="Distancia (m)" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 4 }} />
            <Line type="monotone" dataKey="FC Pico" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={{ fill: '#f97316', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>

        {/* History table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-slate-500 py-2 pr-4">Fecha</th>
                <th className="text-left text-slate-500 py-2 pr-4">Distancia</th>
                <th className="text-left text-slate-500 py-2 pr-4">FC Pico</th>
                <th className="text-left text-slate-500 py-2 pr-4">Borg</th>
                <th className="text-left text-slate-500 py-2">Δ vs Basal</th>
              </tr>
            </thead>
            <tbody>
              {patient.sixMWT.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-600">{formatDate(s.date)}</td>
                  <td className="py-1.5 pr-4 font-medium text-slate-800">{s.distanceMeters} m</td>
                  <td className="py-1.5 pr-4 text-slate-600">{s.heartRatePeak ?? '—'} bpm</td>
                  <td className="py-1.5 pr-4 text-slate-600">{s.fatigue ?? '—'}</td>
                  <td className="py-1.5">
                    {s.isBaseline ? (
                      <span className="text-blue-500 font-medium">Basal</span>
                    ) : baselineSixMWT ? (
                      <DeltaBadge current={s.distanceMeters} baseline={baselineSixMWT.distanceMeters} />
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
