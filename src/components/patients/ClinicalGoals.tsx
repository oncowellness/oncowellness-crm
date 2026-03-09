import { useState } from 'react'
import { Target, Plus, CheckCircle2, Clock, AlertTriangle, X, Save, Trash2, TrendingUp } from 'lucide-react'
import { useClinicalGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useClinicalGoals'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { cn, formatDate } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const METRIC_TYPES = [
  { value: 'Handgrip', label: 'Handgrip (kg)', unit: 'kg' },
  { value: '6MWT', label: '6MWT (m)', unit: 'm' },
  { value: '30STS', label: '30STS (reps)', unit: 'reps' },
  { value: 'TUG', label: 'TUG (s)', unit: 's' },
  { value: 'PHQ-9', label: 'PHQ-9 (puntos)', unit: 'puntos' },
  { value: 'GAD-7', label: 'GAD-7 (puntos)', unit: 'puntos' },
  { value: 'FACIT-F', label: 'FACIT-F (puntos)', unit: 'puntos' },
  { value: 'custom', label: 'Personalizada', unit: '' },
]

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  activa: { label: 'Activa', icon: <Clock size={12} />, classes: 'bg-blue-100 text-blue-700' },
  cumplida: { label: 'Cumplida', icon: <CheckCircle2 size={12} />, classes: 'bg-green-100 text-green-700' },
  vencida: { label: 'Vencida', icon: <AlertTriangle size={12} />, classes: 'bg-red-100 text-red-700' },
  cancelada: { label: 'Cancelada', icon: <X size={12} />, classes: 'bg-slate-100 text-slate-500' },
}

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  alta: { label: 'Alta', dot: 'bg-red-500' },
  media: { label: 'Media', dot: 'bg-yellow-500' },
  baja: { label: 'Baja', dot: 'bg-green-500' },
}

const iCls = 'w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

export function ClinicalGoals() {
  const { selectedPatientId } = useStore()
  const { data: goals = [], isLoading } = useClinicalGoals(selectedPatientId)
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const { user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', metric_type: '', target_value: '',
    target_unit: '', current_value: '', baseline_value: '',
    deadline: '', priority: 'media', notes: '',
  })

  if (!selectedPatientId) return null

  const activeGoals = goals.filter(g => g.status === 'activa')
  const completedGoals = goals.filter(g => g.status === 'cumplida')
  const overdueGoals = goals.filter(g => g.status === 'vencida')

  function resetForm() {
    setForm({ title: '', description: '', metric_type: '', target_value: '', target_unit: '', current_value: '', baseline_value: '', deadline: '', priority: 'media', notes: '' })
    setShowForm(false)
    setEditId(null)
  }

  function startEdit(g: any) {
    setForm({
      title: g.title, description: g.description ?? '', metric_type: g.metric_type ?? '',
      target_value: g.target_value?.toString() ?? '', target_unit: g.target_unit ?? '',
      current_value: g.current_value?.toString() ?? '', baseline_value: g.baseline_value?.toString() ?? '',
      deadline: g.deadline ?? '', priority: g.priority, notes: g.notes ?? '',
    })
    setEditId(g.id)
    setShowForm(true)
  }

  function handleMetricChange(val: string) {
    const m = METRIC_TYPES.find(mt => mt.value === val)
    setForm(f => ({ ...f, metric_type: val, target_unit: m?.unit ?? f.target_unit }))
  }

  function handleSave() {
    if (!form.title.trim() || !user) return
    const payload = {
      title: form.title,
      description: form.description || undefined,
      metric_type: form.metric_type || undefined,
      target_value: form.target_value ? parseFloat(form.target_value) : undefined,
      target_unit: form.target_unit || undefined,
      current_value: form.current_value ? parseFloat(form.current_value) : undefined,
      baseline_value: form.baseline_value ? parseFloat(form.baseline_value) : undefined,
      deadline: form.deadline || undefined,
      priority: form.priority,
      notes: form.notes || undefined,
    }
    if (editId) {
      updateGoal.mutate({ id: editId, ...payload }, { onSuccess: resetForm })
    } else {
      createGoal.mutate({ ...payload, patient_id: selectedPatientId!, created_by: user.id }, { onSuccess: resetForm })
    }
  }

  function markStatus(id: string, status: string) {
    updateGoal.mutate({
      id,
      status,
      ...(status === 'cumplida' ? { completed_at: new Date().toISOString() } : {}),
    })
  }

  function calcProgress(g: any): number {
    if (!g.target_value || !g.baseline_value) return 0
    if (g.current_value == null) return 0
    // For metrics where lower is better (PHQ-9, GAD-7, TUG)
    const lowerIsBetter = ['PHQ-9', 'GAD-7', 'TUG'].includes(g.metric_type)
    const total = Math.abs(g.target_value - g.baseline_value)
    if (total === 0) return 100
    const progress = lowerIsBetter
      ? ((g.baseline_value - g.current_value) / (g.baseline_value - g.target_value)) * 100
      : ((g.current_value - g.baseline_value) / (g.target_value - g.baseline_value)) * 100
    return Math.max(0, Math.min(100, Math.round(progress)))
  }

  const isOverdue = (g: any) => g.deadline && new Date(g.deadline) < new Date() && g.status === 'activa'

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{goals.length}</p>
          <p className="text-[10px] text-slate-500">Total Metas</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
          <p className="text-[10px] text-slate-500">Activas</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
          <p className="text-[10px] text-slate-500">Cumplidas</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{overdueGoals.length}</p>
          <p className="text-[10px] text-slate-500">Vencidas</p>
        </div>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-700">Metas Clínicas</h3>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">
          <Plus size={14} /> Nueva Meta
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-teal-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-teal-700">{editId ? 'Editar Meta' : 'Nueva Meta Clínica'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] text-slate-500 font-medium">Título *</label>
              <input className={iCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Mejorar fuerza de agarre" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-500 font-medium">Descripción</label>
              <textarea className={cn(iCls, 'h-16 resize-none')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Métrica</label>
              <select className={iCls} value={form.metric_type} onChange={e => handleMetricChange(e.target.value)}>
                <option value="">— Sin métrica —</option>
                {METRIC_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Unidad</label>
              <input className={iCls} value={form.target_unit} onChange={e => setForm(f => ({ ...f, target_unit: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Valor Basal</label>
              <input type="number" className={iCls} value={form.baseline_value} onChange={e => setForm(f => ({ ...f, baseline_value: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Valor Actual</label>
              <input type="number" className={iCls} value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Valor Objetivo</label>
              <input type="number" className={iCls} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Fecha Límite</label>
              <input type="date" className={iCls} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Prioridad</label>
              <select className={iCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Notas</label>
              <input className={iCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} disabled={!form.title.trim()} className="flex items-center gap-1 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50">
              <Save size={12} /> {editId ? 'Actualizar' : 'Crear Meta'}
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {isLoading ? (
        <p className="text-xs text-slate-400 text-center py-6">Cargando metas...</p>
      ) : goals.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
          <Target size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Sin metas clínicas definidas</p>
          <p className="text-xs text-slate-400">Crea la primera meta para este paciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(g => {
            const st = STATUS_CONFIG[g.status] ?? STATUS_CONFIG.activa
            const pr = PRIORITY_CONFIG[g.priority] ?? PRIORITY_CONFIG.media
            const progress = calcProgress(g)
            const overdue = isOverdue(g)

            return (
              <div key={g.id} className={cn('bg-white rounded-xl border p-4', overdue ? 'border-red-300' : 'border-slate-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', pr.dot)} />
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{g.title}</h4>
                      <span className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', st.classes)}>
                        {st.icon} {st.label}
                      </span>
                      {overdue && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          <AlertTriangle size={10} /> Vencida
                        </span>
                      )}
                    </div>
                    {g.description && <p className="text-xs text-slate-500 mb-2">{g.description}</p>}

                    {/* Progress bar for metric goals */}
                    {g.target_value != null && g.baseline_value != null && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Basal: {g.baseline_value} {g.target_unit}</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={10} />
                            Actual: {g.current_value ?? '—'} → Objetivo: {g.target_value} {g.target_unit}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-[10px] text-slate-400 mt-0.5 text-right">{progress}% completado</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      {g.metric_type && <span>Métrica: {g.metric_type}</span>}
                      {g.deadline && <span>Límite: {formatDate(g.deadline)}</span>}
                      <span>Creada: {formatDate(g.created_at)}</span>
                    </div>
                    {g.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{g.notes}</p>}
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {g.status === 'activa' && (
                      <>
                        <button onClick={() => markStatus(g.id, 'cumplida')}
                          className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100">
                          ✓ Cumplida
                        </button>
                        <button onClick={() => markStatus(g.id, 'cancelada')}
                          className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100">
                          Cancelar
                        </button>
                      </>
                    )}
                    <button onClick={() => startEdit(g)}
                      className="text-[10px] text-slate-500 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50">
                      Editar
                    </button>
                    <button onClick={() => deleteGoal.mutate({ id: g.id, patientId: g.patient_id })}
                      className="text-[10px] text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
