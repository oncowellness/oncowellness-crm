import { useState } from 'react'
import { Plus, Pencil, Check, X, Layers } from 'lucide-react'
import { usePrograms, useCreateProgram, useUpdateProgram } from '@/hooks/usePrograms'
import { cn } from '../../lib/utils'
import type { ProgramType } from '../../types'

const TYPE_COLORS: Record<ProgramType, string> = {
  FX: 'bg-blue-100 text-blue-700', PS: 'bg-purple-100 text-purple-700',
  NU: 'bg-green-100 text-green-700', EO: 'bg-pink-100 text-pink-700', TS: 'bg-orange-100 text-orange-700',
}
const TYPE_LABELS: Record<ProgramType, string> = {
  FX: 'Fisioterapia', PS: 'Psico-oncología', NU: 'Nutrición', EO: 'Estética Oncológica', TS: 'Trabajo Social',
}
const PROGRAM_TYPES: ProgramType[] = ['FX', 'PS', 'NU', 'EO', 'TS']
const iCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

export function ConfigPrograms() {
  const { data: programs = [] } = usePrograms()
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<any>({})
  const [showNew, setShowNew] = useState(false)
  const [newP, setNewP] = useState({ code: '', tipo: 'FX' as ProgramType, nombre: '', descripcion: '', sesiones: '' as any, duracion: '' })

  function startEdit(p: any) { setDraft({ ...p }); setEditingId(p.id) }
  function saveEdit() {
    if (editingId) {
      updateProgram.mutate({ id: editingId, nombre: draft.nombre, descripcion: draft.descripcion, sesiones: draft.sesiones ? Number(draft.sesiones) : null, duracion: draft.duracion || null })
      setEditingId(null)
    }
  }
  function handleAdd() {
    if (!newP.code.trim() || !newP.nombre.trim()) return
    createProgram.mutate({
      code: newP.code.trim().toUpperCase(),
      tipo: newP.tipo as any,
      nombre: newP.nombre.trim(),
      descripcion: newP.descripcion.trim() || null,
      sesiones: newP.sesiones ? Number(newP.sesiones) : null,
      duracion: newP.duracion?.trim() || null,
    })
    setNewP({ code: '', tipo: 'FX', nombre: '', descripcion: '', sesiones: '', duracion: '' })
    setShowNew(false)
  }

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
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 font-medium block mb-1">Código *</label><input className={iCls} value={newP.code} onChange={e => setNewP(n => ({ ...n, code: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500 font-medium block mb-1">Tipo *</label>
              <select className={iCls} value={newP.tipo} onChange={e => setNewP(n => ({ ...n, tipo: e.target.value as ProgramType }))}>{PROGRAM_TYPES.map(t => <option key={t} value={t}>{t} – {TYPE_LABELS[t]}</option>)}</select>
            </div>
            <div className="col-span-2"><label className="text-xs text-slate-500 font-medium block mb-1">Nombre *</label><input className={iCls} value={newP.nombre} onChange={e => setNewP(n => ({ ...n, nombre: e.target.value }))} /></div>
            <div className="col-span-2"><label className="text-xs text-slate-500 font-medium block mb-1">Descripción</label><input className={iCls} value={newP.descripcion} onChange={e => setNewP(n => ({ ...n, descripcion: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500 font-medium block mb-1">Sesiones</label><input type="number" className={iCls} value={newP.sesiones} onChange={e => setNewP(n => ({ ...n, sesiones: e.target.value }))} /></div>
            <div><label className="text-xs text-slate-500 font-medium block mb-1">Duración</label><input className={iCls} value={newP.duracion} onChange={e => setNewP(n => ({ ...n, duracion: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowNew(false)} className="flex items-center gap-1 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"><X size={14} /> Cancelar</button>
            <button onClick={handleAdd} disabled={!newP.code.trim() || !newP.nombre.trim()} className="flex items-center gap-1 text-sm text-white bg-teal-600 px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-40"><Check size={14} /> Guardar</button>
          </div>
        </div>
      )}

      {PROGRAM_TYPES.map(type => {
        const items = programs.filter(p => p.tipo === type)
        if (items.length === 0) return null
        return (
          <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TYPE_COLORS[type])}>{type}</span>
              <span className="text-sm font-semibold text-slate-700">{TYPE_LABELS[type]}</span>
              <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-2 w-24">Código</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2">Nombre</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 hidden lg:table-cell">Descripción</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-20">Sesiones</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-4 py-2 w-28">Duración</th>
                <th className="w-16" />
              </tr></thead>
              <tbody>
                {items.map(p => editingId === p.id ? (
                  <tr key={p.id} className="bg-teal-50 border-b border-slate-100">
                    <td className="px-5 py-2"><span className="text-xs font-bold text-slate-600">{p.code}</span></td>
                    <td className="px-4 py-2"><input className={iCls} value={draft.nombre} onChange={e => setDraft((d: any) => ({ ...d, nombre: e.target.value }))} /></td>
                    <td className="px-4 py-2 hidden lg:table-cell"><input className={iCls} value={draft.descripcion ?? ''} onChange={e => setDraft((d: any) => ({ ...d, descripcion: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input type="number" className={iCls} value={draft.sesiones ?? ''} onChange={e => setDraft((d: any) => ({ ...d, sesiones: e.target.value ? Number(e.target.value) : null }))} /></td>
                    <td className="px-4 py-2"><input className={iCls} value={draft.duracion ?? ''} onChange={e => setDraft((d: any) => ({ ...d, duracion: e.target.value || null }))} /></td>
                    <td className="px-4 py-2"><div className="flex items-center gap-1"><button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={14} /></button><button onClick={saveEdit} className="p-1 rounded hover:bg-teal-100 text-teal-600"><Check size={14} /></button></div></td>
                  </tr>
                ) : (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3"><span className="text-xs font-bold text-slate-500">{p.code}</span></td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{p.nombre}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{p.descripcion}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 text-center">{p.sesiones ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.duracion ?? '—'}</td>
                    <td className="px-4 py-3"><button onClick={() => startEdit(p)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-white transition-opacity"><Pencil size={11} /> Editar</button></td>
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
