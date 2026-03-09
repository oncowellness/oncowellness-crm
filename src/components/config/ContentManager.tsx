import { useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Save, X, FileText, Video, Package } from 'lucide-react'
import { useContentItems, useCreateContentItem, useUpdateContentItem, useDeleteContentItem } from '@/hooks/useContentItems'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Database } from '@/integrations/supabase/types'

type PhaseJourney = Database['public']['Enums']['phase_journey']
const ALL_PHASES: PhaseJourney[] = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']
const CONTENT_TYPES = ['manual', 'kit', 'guia', 'cuaderno', 'video'] as const

const TYPE_ICONS: Record<string, React.ReactNode> = {
  manual: <BookOpen size={14} />,
  kit: <Package size={14} />,
  guia: <FileText size={14} />,
  cuaderno: <FileText size={14} />,
  video: <Video size={14} />,
}

interface FormState {
  code: string
  title: string
  description: string
  tipo: string
  phases: PhaseJourney[]
  file_url: string
}

const EMPTY_FORM: FormState = { code: '', title: '', description: '', tipo: 'manual', phases: [], file_url: '' }

export function ContentManager() {
  const { data: items = [], isLoading } = useContentItems()
  const createMut = useCreateContentItem()
  const updateMut = useUpdateContentItem()
  const deleteMut = useDeleteContentItem()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function startEdit(item: any) {
    setEditingId(item.id)
    setShowCreate(false)
    setForm({
      code: item.code,
      title: item.title,
      description: item.description ?? '',
      tipo: item.tipo ?? 'manual',
      phases: item.phases ?? [],
      file_url: item.file_url ?? '',
    })
  }

  function startCreate() {
    setEditingId(null)
    setShowCreate(true)
    setForm(EMPTY_FORM)
  }

  function cancel() {
    setEditingId(null)
    setShowCreate(false)
    setForm(EMPTY_FORM)
  }

  function togglePhase(phase: PhaseJourney) {
    setForm(f => ({
      ...f,
      phases: f.phases.includes(phase) ? f.phases.filter(p => p !== phase) : [...f.phases, phase],
    }))
  }

  async function handleSave() {
    if (!form.code.trim() || !form.title.trim()) {
      toast.error('Código y título son obligatorios')
      return
    }
    if (form.code.length > 20 || form.title.length > 200) {
      toast.error('Código máx. 20 caracteres, título máx. 200')
      return
    }

    try {
      if (showCreate) {
        await createMut.mutateAsync({
          code: form.code.trim(),
          title: form.title.trim(),
          description: form.description.trim() || null,
          tipo: form.tipo,
          phases: form.phases,
          file_url: form.file_url.trim() || null,
        })
        toast.success('Contenido creado')
      } else if (editingId) {
        await updateMut.mutateAsync({
          id: editingId,
          code: form.code.trim(),
          title: form.title.trim(),
          description: form.description.trim() || null,
          tipo: form.tipo,
          phases: form.phases,
          file_url: form.file_url.trim() || null,
        })
        toast.success('Contenido actualizado')
      }
      cancel()
    } catch {
      toast.error('Error al guardar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Contenido eliminado')
      setDeleteConfirm(null)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Biblioteca de Contenido</h2>
            <p className="text-xs text-muted-foreground">{items.length} recursos educativos</p>
          </div>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <Plus size={14} /> Nuevo contenido
        </button>
      </div>

      {/* Create / Edit form */}
      {(showCreate || editingId) && (
        <div className="bg-card rounded-xl border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {showCreate ? 'Crear nuevo contenido' : 'Editar contenido'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Código *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                maxLength={20}
                placeholder="LB-01"
                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={200}
              placeholder="Manual de Bienvenida"
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={500}
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL del archivo</label>
            <input
              value={form.file_url}
              onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
              placeholder="https://..."
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Fases aplicables</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PHASES.map(phase => (
                <button
                  key={phase}
                  onClick={() => togglePhase(phase)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                    form.phases.includes(phase)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-background text-muted-foreground border-border hover:border-teal-400'
                  )}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Save size={14} /> {isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={cancel} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border text-muted-foreground hover:bg-muted">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Content items list */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Código</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Título</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Fases</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">No hay contenido registrado</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className={cn('hover:bg-muted/30', editingId === item.id && 'bg-teal-50/50')}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-teal-600">{item.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{TYPE_ICONS[item.tipo ?? 'manual']}</span>
                      <span className="font-medium text-foreground">{item.title}</span>
                    </div>
                    {item.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.tipo ?? 'manual'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.phases ?? []).map((p: string) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deleteConfirm === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDelete(item.id)} className="text-[11px] px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirmar</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[11px] px-2 py-1 border rounded text-muted-foreground hover:bg-muted">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
