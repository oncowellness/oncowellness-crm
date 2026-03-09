import { useState } from 'react'
import { Plus, Pencil, Check, X, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { usePrograms, useCreateProgram, useUpdateProgram, type ProgramRow, type ProgramInsert } from '@/hooks/usePrograms'
import { cn } from '../../lib/utils'
import type { ProgramType } from '../../types'
import { MultiSelect } from '../ui/MultiSelect'
import {
  SINTOMAS_OPTIONS,
  MOMENTO_JOURNEY_OPTIONS,
  MIND_STATE_OPTIONS,
  PERFIL_PACIENTE_OPTIONS,
  RECURSOS_OPTIONS,
  CANAL_CAPTACION_OPTIONS,
  PRODUCTOS_ASOCIADOS_OPTIONS,
} from './programTaxonomy'

const ALL_TYPES: ProgramType[] = ['FX', 'PS', 'NU', 'EO', 'TS', 'TO', 'SX', 'PA', 'ED', 'PI']
const TYPE_COLORS: Record<string, string> = {
  FX: 'bg-blue-100 text-blue-700', PS: 'bg-purple-100 text-purple-700',
  NU: 'bg-green-100 text-green-700', EO: 'bg-pink-100 text-pink-700',
  TS: 'bg-orange-100 text-orange-700', TO: 'bg-amber-100 text-amber-700',
  SX: 'bg-rose-100 text-rose-700', PA: 'bg-red-100 text-red-700',
  ED: 'bg-cyan-100 text-cyan-700', PI: 'bg-indigo-100 text-indigo-700',
}
const TYPE_LABELS: Record<string, string> = {
  FX: 'Fisioterapia', PS: 'Psico-oncología', NU: 'Nutrición',
  EO: 'Estética Oncológica', TS: 'Trabajo Social', TO: 'Terapia Ocupacional',
  SX: 'Sexología', PA: 'Paliativos / Dolor', ED: 'Educación', PI: 'Pack Integral',
}

const MODALIDAD_OPTIONS = [
  'Sesión individual suelta', 'Pack cerrado', 'Suscripción mensual',
  'Suscripción trimestral', 'Taller grupal', 'Programa gratuito / incluido',
  'Visita domiciliaria', 'Suscripción digital', 'Pack intensivo + suscripción mantenimiento',
  'Suscripción mensual integral', 'Pack trimestral', 'Servicio incluido',
]

const INTERVENCION_OPTIONS = [
  'Individual, presencial', 'Individual, presencial/online',
  'Individual, presencial/domicilio', 'Individual/grupal, presencial',
  'Individual/grupal, presencial + plan domiciliario',
  'Grupal, presencial', 'Grupal, presencial/online',
  'Grupal/individual, presencial', 'Grupal/individual, presencial/online',
  'Pack multidisciplinar, presencial',
  'Pack multidisciplinar, presencial + domicilio',
  'Online, asincrónico + sincrónico',
  'Individual/familiar, presencial',
]

const iCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'
const labelCls = 'text-xs text-slate-500 font-medium block mb-1'
const selectCls = cn(iCls, 'appearance-none')

// Helper: comma-separated string ↔ array
function csvToArray(val: string | null): string[] {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}
function arrayToCsv(arr: string[]): string | null {
  return arr.length ? arr.join(', ') : null
}

function emptyDraft(): Omit<ProgramInsert, 'tipo'> & { tipo: string } {
  return {
    code: '', tipo: 'FX', nombre: '', descripcion: '', sesiones: null,
    duracion: '', tipo_intervencion: '', objetivos: '', sintomas: '',
    momento_journey: '', mind_state_paciente: '', contenidos: '',
    frecuencia: '', duracion_semanas: null, perfil_paciente: '',
    recursos: '', modalidad: '', precio_sesion: null, coste_sesion: null,
    canal_captacion: '', indicadores_resultado: '', productos_asociados: '',
    paquetes_relacionados: '',
  }
}

function ProgramForm({ draft, onChange, isNew, programCodes }: {
  draft: any; onChange: (d: any) => void; isNew?: boolean; programCodes?: string[]
}) {
  const set = (k: string, v: any) => onChange({ ...draft, [k]: v })
  const setMulti = (k: string, arr: string[]) => set(k, arrayToCsv(arr))
  const margen = (draft.precio_sesion ?? 0) - (draft.coste_sesion ?? 0)
  const margenPct = draft.precio_sesion ? ((margen / draft.precio_sesion) * 100).toFixed(0) : '—'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
      {/* Row 1 - Identity */}
      {isNew && (
        <div><label className={labelCls}>Código *</label>
          <input className={iCls} value={draft.code} onChange={e => set('code', e.target.value)} placeholder="FX-01" /></div>
      )}
      {isNew && (
        <div><label className={labelCls}>Tipo / Área *</label>
          <select className={selectCls} value={draft.tipo} onChange={e => set('tipo', e.target.value)}>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t} – {TYPE_LABELS[t]}</option>)}
          </select></div>
      )}
      <div className={isNew ? '' : 'lg:col-span-2'}>
        <label className={labelCls}>Nombre *</label>
        <input className={iCls} value={draft.nombre} onChange={e => set('nombre', e.target.value)} />
      </div>

      {/* Description */}
      <div className="lg:col-span-3">
        <label className={labelCls}>Descripción</label>
        <input className={iCls} value={draft.descripcion ?? ''} onChange={e => set('descripcion', e.target.value)} />
      </div>

      {/* Intervention type & Modality - SELECTORS */}
      <div><label className={labelCls}>Tipo Intervención</label>
        <select className={selectCls} value={draft.tipo_intervencion ?? ''} onChange={e => set('tipo_intervencion', e.target.value || null)}>
          <option value="">— Seleccionar —</option>
          {INTERVENCION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><label className={labelCls}>Modalidad Producto</label>
        <select className={selectCls} value={draft.modalidad ?? ''} onChange={e => set('modalidad', e.target.value || null)}>
          <option value="">— Seleccionar —</option>
          {MODALIDAD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select></div>
      <div><label className={labelCls}>Frecuencia Sesiones</label>
        <input className={iCls} value={draft.frecuencia ?? ''} onChange={e => set('frecuencia', e.target.value || null)} placeholder="2-3 ses/sem" /></div>

      {/* Sessions & Duration */}
      <div><label className={labelCls}>Nº Sesiones</label>
        <input type="number" className={iCls} value={draft.sesiones ?? ''} onChange={e => set('sesiones', e.target.value ? Number(e.target.value) : null)} /></div>
      <div><label className={labelCls}>Duración (texto)</label>
        <input className={iCls} value={draft.duracion ?? ''} onChange={e => set('duracion', e.target.value || null)} placeholder="8 semanas" /></div>
      <div><label className={labelCls}>Duración (semanas)</label>
        <input type="number" className={iCls} value={draft.duracion_semanas ?? ''} onChange={e => set('duracion_semanas', e.target.value ? Number(e.target.value) : null)} /></div>

      {/* Pricing */}
      <div><label className={labelCls}>Precio/Sesión (€)</label>
        <input type="number" step="0.01" className={iCls} value={draft.precio_sesion ?? ''} onChange={e => set('precio_sesion', e.target.value ? Number(e.target.value) : null)} /></div>
      <div><label className={labelCls}>Coste/Sesión (€)</label>
        <input type="number" step="0.01" className={iCls} value={draft.coste_sesion ?? ''} onChange={e => set('coste_sesion', e.target.value ? Number(e.target.value) : null)} /></div>
      <div>
        <label className={labelCls}>Margen</label>
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
          <span className={cn('font-semibold', margen > 0 ? 'text-emerald-600' : 'text-slate-400')}>
            {draft.precio_sesion != null ? `€${margen.toFixed(2)} (${margenPct}%)` : '—'}
          </span>
        </div>
      </div>

      {/* Clinical content */}
      <div className="lg:col-span-3"><label className={labelCls}>Objetivos Principales</label>
        <textarea className={cn(iCls, 'h-16 resize-none')} value={draft.objetivos ?? ''} onChange={e => set('objetivos', e.target.value || null)} /></div>
      <div className="lg:col-span-3"><label className={labelCls}>Contenidos / Técnicas Clave</label>
        <textarea className={cn(iCls, 'h-16 resize-none')} value={draft.contenidos ?? ''} onChange={e => set('contenidos', e.target.value || null)} /></div>

      {/* ── MULTI-SELECT FIELDS ── */}
      <div className="lg:col-span-3">
        <label className={labelCls}>Síntomas / Pain Points</label>
        <MultiSelect
          options={SINTOMAS_OPTIONS}
          value={csvToArray(draft.sintomas)}
          onChange={arr => setMulti('sintomas', arr)}
          placeholder="Seleccionar síntomas…"
          maxDisplay={4}
        />
      </div>

      <div>
        <label className={labelCls}>Momento del Journey</label>
        <MultiSelect
          options={MOMENTO_JOURNEY_OPTIONS}
          value={csvToArray(draft.momento_journey)}
          onChange={arr => setMulti('momento_journey', arr)}
          placeholder="Seleccionar momento(s)…"
        />
      </div>
      <div>
        <label className={labelCls}>Mind State Paciente</label>
        <MultiSelect
          options={MIND_STATE_OPTIONS}
          value={csvToArray(draft.mind_state_paciente)}
          onChange={arr => setMulti('mind_state_paciente', arr)}
          placeholder="Seleccionar estados…"
        />
      </div>
      <div>
        <label className={labelCls}>Perfil Paciente Diana</label>
        <MultiSelect
          options={PERFIL_PACIENTE_OPTIONS}
          value={csvToArray(draft.perfil_paciente)}
          onChange={arr => setMulti('perfil_paciente', arr)}
          placeholder="Seleccionar perfiles…"
          maxDisplay={2}
        />
      </div>

      <div className="lg:col-span-2">
        <label className={labelCls}>Recursos Necesarios</label>
        <MultiSelect
          options={RECURSOS_OPTIONS}
          value={csvToArray(draft.recursos)}
          onChange={arr => setMulti('recursos', arr)}
          placeholder="Seleccionar recursos…"
          maxDisplay={3}
        />
      </div>
      <div>
        <label className={labelCls}>Canal Captación</label>
        <MultiSelect
          options={CANAL_CAPTACION_OPTIONS}
          value={csvToArray(draft.canal_captacion)}
          onChange={arr => setMulti('canal_captacion', arr)}
          placeholder="Seleccionar canales…"
        />
      </div>

      <div>
        <label className={labelCls}>Productos Asociados</label>
        <MultiSelect
          options={PRODUCTOS_ASOCIADOS_OPTIONS}
          value={csvToArray(draft.productos_asociados)}
          onChange={arr => setMulti('productos_asociados', arr)}
          placeholder="Seleccionar productos…"
        />
      </div>
      <div className="lg:col-span-2">
        <label className={labelCls}>Paquetes Relacionados</label>
        <MultiSelect
          options={programCodes ?? []}
          value={csvToArray(draft.paquetes_relacionados)}
          onChange={arr => setMulti('paquetes_relacionados', arr)}
          placeholder="Seleccionar programas…"
          maxDisplay={4}
        />
      </div>
    </div>
  )
}

export function ConfigPrograms() {
  const { data: programs = [] } = usePrograms()
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({})
  const [showNew, setShowNew] = useState(false)
  const [newP, setNewP] = useState(emptyDraft())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const programCodes = programs.map(p => p.code).sort()

  function startEdit(p: ProgramRow) { setDraft({ ...p }); setEditingId(p.id) }
  function saveEdit() {
    if (!editingId) return
    const { id, code, tipo, ...fields } = draft
    updateProgram.mutate({ id: editingId, ...fields })
    setEditingId(null)
  }
  function handleAdd() {
    if (!newP.code.trim() || !newP.nombre.trim()) return
    const payload: any = { ...newP, code: newP.code.trim().toUpperCase() }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    payload.code = newP.code.trim().toUpperCase()
    payload.nombre = newP.nombre.trim()
    createProgram.mutate(payload)
    setNewP(emptyDraft())
    setShowNew(false)
  }

  const typesPresent = ALL_TYPES.filter(t => programs.some(p => p.tipo === t))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-teal-600" />
          <h1 className="text-lg font-bold text-slate-800">Programas</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{programs.length}</span>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-teal-700 shadow-sm"><Plus size={15} /> Nuevo Programa</button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-teal-700 mb-4">Nuevo Programa</p>
          <ProgramForm draft={newP} onChange={setNewP} isNew programCodes={programCodes} />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowNew(false)} className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"><X size={14} /> Cancelar</button>
            <button onClick={handleAdd} disabled={!newP.code.trim() || !newP.nombre.trim()} className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-40"><Check size={14} /> Guardar</button>
          </div>
        </div>
      )}

      {typesPresent.map(type => {
        const items = programs.filter(p => p.tipo === type)
        if (items.length === 0) return null
        return (
          <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[type] || 'bg-slate-100 text-slate-700')}>{type}</span>
              <span className="text-sm font-semibold text-slate-700">{TYPE_LABELS[type] || type}</span>
              <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-2 w-24">Código</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2">Nombre</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2">Descripción</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 hidden lg:table-cell">Objetivos</th>
                <th className="w-20" />
              </tr></thead>
              <tbody>
                {items.map(p => {
                  const isEditing = editingId === p.id
                  const isExpanded = expandedId === p.id

                  if (isEditing) return (
                    <tr key={p.id}>
                      <td colSpan={5} className="p-4 bg-teal-50 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[type])}>{p.code}</span>
                          <span className="text-sm font-semibold text-slate-700">Editando</span>
                        </div>
                        <ProgramForm draft={draft} onChange={setDraft} programCodes={programCodes} />
                        <div className="flex justify-end gap-2 mt-3">
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"><X size={14} /> Cancelar</button>
                          <button onClick={saveEdit} className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700"><Check size={14} /> Guardar</button>
                        </div>
                      </td>
                    </tr>
                  )

                  return (
                    <tr key={p.id} className={cn('border-b border-slate-50 last:border-0 group cursor-pointer hover:bg-slate-50/60 transition-colors', isExpanded && 'bg-slate-50/40')}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <td className="px-5 py-3"><span className="text-xs font-bold text-slate-500">{p.code}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-700">{p.nombre}</div>
                        {p.tipo_intervencion && <div className="text-xs text-slate-400 mt-0.5">{p.tipo_intervencion}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{p.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell max-w-xs truncate">{p.objetivos || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <ChevronDown size={14} />
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); startEdit(p) }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-white transition-opacity">
                            <Pencil size={11} /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {/* Expanded detail rows */}
                {items.map(p => expandedId === p.id && editingId !== p.id && (
                  <tr key={`${p.id}-detail`} className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="max-h-80 overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          {/* Identity & Structure */}
                          <Detail label="Código" value={p.code} />
                          <Detail label="Tipo / Área" value={`${p.tipo} – ${TYPE_LABELS[p.tipo] || p.tipo}`} />
                          <Detail label="Nombre" value={p.nombre} />
                          <Detail label="Descripción" value={p.descripcion || '—'} span={3} />

                          {/* Intervention */}
                          <Detail label="Tipo Intervención" value={p.tipo_intervencion || '—'} />
                          <Detail label="Modalidad Producto" value={p.modalidad || '—'} />
                          <Detail label="Frecuencia Sesiones" value={p.frecuencia || '—'} />

                          {/* Sessions & Duration */}
                          <Detail label="Nº Sesiones" value={p.sesiones != null ? String(p.sesiones) : '—'} />
                          <Detail label="Duración" value={p.duracion || '—'} />
                          <Detail label="Duración (semanas)" value={p.duracion_semanas != null ? String(p.duracion_semanas) : '—'} />

                          {/* Pricing */}
                          <Detail label="Precio/Sesión" value={p.precio_sesion != null ? `€${Number(p.precio_sesion).toFixed(2)}` : '—'} />
                          <Detail label="Coste/Sesión" value={p.coste_sesion != null ? `€${Number(p.coste_sesion).toFixed(2)}` : '—'} />
                          {(() => {
                            const m = (p.precio_sesion ?? 0) - (p.coste_sesion ?? 0)
                            const pct = p.precio_sesion ? ((m / p.precio_sesion) * 100).toFixed(0) : null
                            return <Detail label="Margen" value={p.precio_sesion != null ? `€${m.toFixed(2)} (${pct}%)` : '—'} />
                          })()}

                          {/* Clinical */}
                          <Detail label="Objetivos Principales" value={p.objetivos || '—'} span={3} />
                          <Detail label="Contenidos / Técnicas" value={p.contenidos || '—'} span={3} />
                          <Detail label="Indicadores de Resultado" value={p.indicadores_resultado || '—'} span={3} />

                          {/* Tags */}
                          <TagDetail label="Síntomas / Pain Points" value={p.sintomas || ''} span={3} />
                          <TagDetail label="Momento del Journey" value={p.momento_journey || ''} />
                          <TagDetail label="Mind State Paciente" value={p.mind_state_paciente || ''} />
                          <TagDetail label="Perfil Paciente Diana" value={p.perfil_paciente || ''} span={2} />
                          <TagDetail label="Recursos Necesarios" value={p.recursos || ''} span={2} />
                          <TagDetail label="Canal Captación" value={p.canal_captacion || ''} />
                          <TagDetail label="Productos Asociados" value={p.productos_asociados || ''} />
                          <TagDetail label="Paquetes Relacionados" value={p.paquetes_relacionados || ''} span={2} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function Detail({ label, value, span }: { label: string; value: string; span?: number }) {
  return (
    <div className={span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : ''}>
      <span className="font-semibold text-slate-500 block mb-0.5">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}

function TagDetail({ label, value, span }: { label: string; value: string; span?: number }) {
  const tags = value.split(',').map(s => s.trim()).filter(Boolean)
  return (
    <div className={span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : ''}>
      <span className="font-semibold text-slate-500 block mb-1">{label}</span>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span key={i} className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
