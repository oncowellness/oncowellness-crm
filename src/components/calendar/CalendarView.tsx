import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2, CalendarDays, User, Clock } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { usePrograms } from '@/hooks/usePrograms'
import { useAllSessions, useCreateSession, useUpdateSession, useDeleteSession } from '@/hooks/useSessions'
import { cn } from '../../lib/utils'
import type { SessionStatus } from '../../types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const STATUS_CONFIG: Record<SessionStatus, { label: string; dot: string; badge: string }> = {
  pendiente: { label: 'Pendiente', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  confirmada: { label: 'Confirmada', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700' },
  realizada: { label: 'Realizada', dot: 'bg-green-400', badge: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', dot: 'bg-red-400', badge: 'bg-red-100 text-red-700' },
}

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  FX: 'bg-blue-500', PS: 'bg-purple-500', NU: 'bg-green-500', EO: 'bg-pink-500', TS: 'bg-orange-500',
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfMonth(year: number, month: number) { return (new Date(year, month, 1).getDay() + 6) % 7 }
function toDateKey(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` }

export function CalendarView() {
  const { data: patients = [] } = usePatients()
  const { data: programs = [] } = usePrograms()
  const { data: allSessions = [] } = useAllSessions()
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterPatientId, setFilterPatientId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all')

  // New session form
  const [showForm, setShowForm] = useState(false)
  const [formPatientId, setFormPatientId] = useState('')
  const [formProgramCode, setFormProgramCode] = useState('')
  const [formStatus, setFormStatus] = useState<SessionStatus>('confirmada')
  const [formTherapist, setFormTherapist] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const eventMap = new Map<string, any[]>()
  for (const s of (allSessions ?? [])) {
    if (filterPatientId !== 'all' && s.patient_id !== filterPatientId) continue
    if (filterStatus !== 'all' && s.status !== filterStatus) continue
    const key = s.fecha
    if (!eventMap.has(key)) eventMap.set(key, [])
    eventMap.get(key)!.push(s)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  function prevMonth() { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }
  function nextMonth() { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }

  function handleAddSession() {
    if (!formPatientId || !formProgramCode || !selectedDate) return
    createSession.mutate({
      patient_id: formPatientId,
      programa_code: formProgramCode,
      fecha: selectedDate,
      status: formStatus as any,
      therapist_name: formTherapist || null,
      notas: formNotes || null,
    })
    setShowForm(false); setFormProgramCode(''); setFormTherapist(''); setFormNotes('')
  }

  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center"><CalendarDays size={18} className="text-teal-600" /></div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Calendario de Citas</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterPatientId} onChange={e => setFilterPatientId(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="all">Todos los pacientes</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as SessionStatus | 'all')} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16} className="text-slate-600" /></button>
          <h3 className="text-base font-bold text-slate-800">{MONTHS[currentMonth]} {currentYear}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={16} className="text-slate-600" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="h-28 border-b border-r border-slate-50 bg-slate-50/50" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = toDateKey(currentYear, currentMonth, day)
            const dayEvents = eventMap.get(dateKey) ?? []
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate
            return (
              <div key={day} onClick={() => setSelectedDate(isSelected ? null : dateKey)} className={cn('h-28 border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors overflow-hidden', isSelected && 'bg-teal-50 border-teal-200', !isSelected && 'hover:bg-slate-50')}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full', isToday && 'bg-teal-500 text-white', !isToday && 'text-slate-700')}>{day}</span>
                  {dayEvents.length > 0 && <span className="text-[10px] text-slate-400">{dayEvents.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-1 bg-white rounded px-1.5 py-0.5 border border-slate-100 shadow-sm">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PROGRAM_TYPE_COLORS[ev.programa_code?.split('-')[0]] ?? 'bg-slate-400')} />
                      <p className="text-[10px] text-slate-700 truncate flex-1">{ev.programa_code}</p>
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_CONFIG[ev.status as SessionStatus]?.dot ?? 'bg-slate-400')} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected date modal */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">{selectedDate}</h3>
            <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} className="text-slate-500" /></button>
          </div>

          {selectedEvents.map((ev: any) => {
            const cfg = STATUS_CONFIG[ev.status as SessionStatus]
            const patientName = patients.find(p => p.id === ev.patient_id)?.nombre ?? '—'
            return (
              <div key={ev.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{ev.programa_code}</p>
                    <p className="text-xs text-slate-600">{patientName}</p>
                    {ev.therapist_name && <p className="text-xs text-slate-500">{ev.therapist_name}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', cfg?.badge)}>{cfg?.label}</span>
                    <button onClick={() => deleteSession.mutate(ev.id)} className="p-1 hover:bg-red-50 rounded-lg"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => (
                    <button key={s} onClick={() => updateSession.mutate({ id: ev.id, status: s as any })}
                      className={cn('text-[10px] px-2 py-1 rounded-lg border transition-colors', ev.status === s ? STATUS_CONFIG[s].badge + ' border-transparent font-semibold' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {!showForm ? (
            <button onClick={() => { setShowForm(true); if (patients.length > 0) setFormPatientId(patients[0].id) }}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl py-3 text-sm text-slate-500 hover:text-teal-600 transition-colors">
              <Plus size={16} /> Nueva cita
            </button>
          ) : (
            <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-teal-700">Nueva cita – {selectedDate}</p>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Paciente *</label>
                <select value={formPatientId} onChange={e => setFormPatientId(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {patients.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Programa *</label>
                <select value={formProgramCode} onChange={e => setFormProgramCode(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">— Seleccionar —</option>
                  {programs.map(pr => <option key={pr.code} value={pr.code}>{pr.code} – {pr.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-600 block mb-1">Estado</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as SessionStatus)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-slate-600 block mb-1">Terapeuta</label>
                  <input type="text" value={formTherapist} onChange={e => setFormTherapist(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddSession} disabled={!formPatientId || !formProgramCode || createSession.isPending} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white text-sm py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40"><Check size={14} /> Guardar</button>
                <button onClick={() => setShowForm(false)} className="px-4 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
