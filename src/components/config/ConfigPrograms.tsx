import { useState } from 'react'
import { Plus, Pencil, Check, X, Layers, ChevronDown, ChevronUp, Euro, DollarSign } from 'lucide-react'
import { usePrograms, useCreateProgram, useUpdateProgram, type ProgramRow, type ProgramInsert } from '@/hooks/usePrograms'
import { cn } from '../../lib/utils'
import type { ProgramType } from '../../types'

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
  'Visita domiciliaria', 'Suscripción digital',
]

const INTERVENCION_OPTIONS = [
  'Individual, presencial', 'Individual, presencial/online',
  'Individual, presencial/domicilio', 'Individual/grupal, presencial',
  'Individual/grupal, presencial + plan domiciliario',
  'Grupal, presencial', 'Grupal, presencial/online',
  'Pack multidisciplinar, presencial',
  'Pack multidisciplinar, presencial + domicilio',
  'Online, asincrónico + sincrónico',
]

const iCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'
const labelCls = 'text-xs text-slate-500 font-medium block mb-1'
const selectCls = cn(iCls, 'appearance-none')

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

function ProgramForm({ draft, onChange, isNew }: {
  draft: any; onChange: (d: any) => void; isNew?: boolean
}) {
  const set = (k: string, v: any) => onChange({ ...draft, [k]: v })
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
      <div><label className={labelCls}>Síntomas / Pain Points</label>
        <input className={iCls} value={draft.sintomas ?? ''} onChange={e => set('sintomas', e.target.value || null)} /></div>
      <div><label className={labelCls}>Momento del Journey</label>
        <input className={iCls} value={draft.momento_journey ?? ''} onChange={e => set('momento_journey', e.target.value || null)} /></div>
      <div><label className={labelCls}>Mind State Paciente</label>
        <input className={iCls} value={draft.mind_state_paciente ?? ''} onChange={e => set('mind_state_paciente', e.target.value || null)} /></div>

      {/* Target & Resources */}
      <div className="lg:col-span-2"><label className={labelCls}>Perfil Paciente Diana</label>
        <input className={iCls} value={draft.perfil_paciente ?? ''} onChange={e => set('perfil_paciente', e.target.value || null)} /></div>
      <div><label className={labelCls}>Recursos Necesarios</label>
        <input className={iCls} value={draft.recursos ?? ''} onChange={e => set('recursos', e.target.value || null)} /></div>

      {/* Cross-references */}
      <div><label className={labelCls}>Canal Captación</label>
        <input className={iCls} value={draft.canal_captacion ?? ''} onChange={e => set('canal_captacion', e.target.value || null)} /></div>
      <div><label className={labelCls}>Productos Asociados</label>
        <input className={iCls} value={draft.productos_asociados ?? ''} onChange={e => set('productos_asociados', e.target.value || null)} /></div>
      <div><label className={labelCls}>Paquetes Relacionados</label>
        <input className={iCls} value={draft.paquetes_relacionados ?? ''} onChange={e => set('paquetes_relacionados', e.target.value || null)} /></div>
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
    // Clean empty strings to null
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
          <ProgramForm draft={newP} onChange={setNewP} isNew />
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
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 hidden lg:table-cell w-40">Modalidad</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-20">Ses.</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-24 hidden md:table-cell">Precio</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-24 hidden md:table-cell">Margen</th>
                <th className="w-24" />
              </tr></thead>
              <tbody>
                {items.map(p => {
                  const isEditing = editingId === p.id
                  const isExpanded = expandedId === p.id
                  const margen = (p.precio_sesion ?? 0) - (p.coste_sesion ?? 0)
                  const margenPct = p.precio_sesion ? ((margen / p.precio_sesion) * 100).toFixed(0) : null

                  if (isEditing) return (
                    <tr key={p.id}>
                      <td colSpan={7} className="p-4 bg-teal-50 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[type])}>{p.code}</span>
                          <span className="text-sm font-semibold text-slate-700">Editando</span>
                        </div>
                        <ProgramForm draft={draft} onChange={setDraft} />
                        <div className="flex justify-end gap-2 mt-3">
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"><X size={14} /> Cancelar</button>
                          <button onClick={saveEdit} className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700"><Check size={14} /> Guardar</button>
                        </div>
                      </td>
                    </tr>
                  )

                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 group">
                      <td className="px-5 py-3"><span className="text-xs font-bold text-slate-500">{p.code}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-700">{p.nombre}</div>
                        {p.tipo_intervencion && <div className="text-xs text-slate-400 mt-0.5">{p.tipo_intervencion}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{p.modalidad ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 text-center">{p.sesiones ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{p.precio_sesion != null ? `€${Number(p.precio_sesion).toFixed(0)}` : '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {p.precio_sesion != null ? (
                          <span className={cn('text-xs font-semibold', margen > 0 ? 'text-emerald-600' : 'text-red-500')}>
                            €{margen.toFixed(0)} ({margenPct}%)
                          </span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 transition-opacity">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button onClick={() => startEdit(p)}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {p.objetivos && <Detail label="Objetivos" value={p.objetivos} span={3} />}
                        {p.contenidos && <Detail label="Contenidos / Técnicas" value={p.contenidos} span={3} />}
                        {p.sintomas && <Detail label="Síntomas / Pain Points" value={p.sintomas} />}
                        {p.momento_journey && <Detail label="Momento Journey" value={p.momento_journey} />}
                        {p.mind_state_paciente && <Detail label="Mind State" value={p.mind_state_paciente} />}
                        {p.perfil_paciente && <Detail label="Perfil Paciente Diana" value={p.perfil_paciente} span={2} />}
                        {p.recursos && <Detail label="Recursos" value={p.recursos} />}
                        {p.frecuencia && <Detail label="Frecuencia" value={p.frecuencia} />}
                        {p.duracion && <Detail label="Duración" value={p.duracion} />}
                        {p.canal_captacion && <Detail label="Canal Captación" value={p.canal_captacion} />}
                        {p.productos_asociados && <Detail label="Productos Asociados" value={p.productos_asociados} />}
                        {p.paquetes_relacionados && <Detail label="Paquetes Relacionados" value={p.paquetes_relacionados} />}
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
    <div className={span ? `lg:col-span-${span}` : ''}>
      <span className="font-semibold text-slate-500 block mb-0.5">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
