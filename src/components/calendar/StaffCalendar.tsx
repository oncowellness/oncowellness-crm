import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Users, CalendarDays, Clock, BarChart2, User } from 'lucide-react'
import { useAllSessions } from '@/hooks/useSessions'
import { useProfiles } from '@/hooks/useProfiles'
import { usePatients } from '@/hooks/usePatients'
import { cn } from '@/lib/utils'
import type { SessionStatus } from '@/types'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const STATUS_DOT: Record<string, string> = {
  pendiente: 'bg-yellow-400',
  confirmada: 'bg-blue-400',
  realizada: 'bg-green-400',
  cancelada: 'bg-red-400',
}

const PROGRAM_COLORS: Record<string, string> = {
  FX: 'bg-blue-500', PS: 'bg-purple-500', NU: 'bg-green-500', EO: 'bg-pink-500', TS: 'bg-orange-500',
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }
function toKey(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }

export function StaffCalendar() {
  const { data: sessions = [] } = useAllSessions()
  const { data: profiles = [] } = useProfiles()
  const { data: patients = [] } = usePatients()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Staff list from profiles (those who have sessions)
  const staffWithSessions = useMemo(() => {
    const ids = new Set(sessions.map((s: any) => s.staff_id).filter(Boolean))
    return profiles.filter(p => ids.has(p.user_id))
  }, [sessions, profiles])

  // Filter sessions by staff
  const filteredSessions = useMemo(() => {
    if (selectedStaffId === 'all') return sessions
    return sessions.filter((s: any) => s.staff_id === selectedStaffId)
  }, [sessions, selectedStaffId])

  // Build event map
  const eventMap = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const s of filteredSessions) {
      const key = (s as any).fecha
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [filteredSessions])

  // Workload stats for current month
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthSessions = filteredSessions.filter((s: any) => s.fecha?.startsWith(monthPrefix))
    const total = monthSessions.length
    const completed = monthSessions.filter((s: any) => s.status === 'realizada').length
    const pending = monthSessions.filter((s: any) => s.status === 'pendiente' || s.status === 'confirmada').length
    const cancelled = monthSessions.filter((s: any) => s.status === 'cancelada').length

    // Per-day average (working days)
    const workingDays = Math.max(1, Array.from({ length: getDaysInMonth(year, month) }, (_, i) => {
      const dow = new Date(year, month, i + 1).getDay()
      return dow !== 0 && dow !== 6 ? 1 : 0
    }).reduce((a, b) => a + b, 0))

    return { total, completed, pending, cancelled, avgPerDay: (total / workingDays).toFixed(1) }
  }, [filteredSessions, year, month])

  // Per-staff workload for current month
  const staffWorkload = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthSessions = sessions.filter((s: any) => s.fecha?.startsWith(monthPrefix) && s.staff_id)
    const map = new Map<string, { total: number; completed: number }>()
    for (const s of monthSessions) {
      const sid = (s as any).staff_id
      if (!map.has(sid)) map.set(sid, { total: 0, completed: 0 })
      const entry = map.get(sid)!
      entry.total++
      if ((s as any).status === 'realizada') entry.completed++
    }
    return map
  }, [sessions, year, month])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []
  const selectedStaffName = selectedStaffId === 'all' ? 'Todo el equipo' : (profiles.find(p => p.user_id === selectedStaffId)?.nombre ?? 'Terapeuta')

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Agenda del Equipo Clínico</h2>
            <p className="text-xs text-muted-foreground">{selectedStaffName} · {MONTHS[month]} {year}</p>
          </div>
        </div>
        <select
          value={selectedStaffId}
          onChange={e => setSelectedStaffId(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="all">Todo el equipo</option>
          {staffWithSessions.map(p => (
            <option key={p.user_id} value={p.user_id}>{p.nombre} {p.especialidad ? `(${p.especialidad})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Workload KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total sesiones', value: monthStats.total, icon: <CalendarDays size={14} />, color: 'text-blue-600 bg-blue-100' },
          { label: 'Realizadas', value: monthStats.completed, icon: <Clock size={14} />, color: 'text-green-600 bg-green-100' },
          { label: 'Pendientes', value: monthStats.pending, icon: <Clock size={14} />, color: 'text-yellow-600 bg-yellow-100' },
          { label: 'Canceladas', value: monthStats.cancelled, icon: <Clock size={14} />, color: 'text-red-600 bg-red-100' },
          { label: 'Media/día', value: monthStats.avgPerDay, icon: <BarChart2 size={14} />, color: 'text-indigo-600 bg-indigo-100' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', kpi.color)}>{kpi.icon}</div>
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-card rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg"><ChevronLeft size={16} /></button>
            <h3 className="text-sm font-bold text-foreground">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="h-24 border-b border-r border-border/30 bg-muted/20" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = toKey(year, month, day)
              const dayEvents = eventMap.get(dateKey) ?? []
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate
              return (
                <div key={day} onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={cn('h-24 border-b border-r border-border/30 p-1 cursor-pointer transition-colors overflow-hidden',
                    isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-muted/50'
                  )}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn('text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                      isToday ? 'bg-teal-500 text-white' : 'text-foreground'
                    )}>{day}</span>
                    {dayEvents.length > 0 && <span className="text-[9px] text-muted-foreground">{dayEvents.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev: any) => (
                      <div key={ev.id} className="flex items-center gap-1 bg-card rounded px-1 py-0.5 border border-border/50">
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PROGRAM_COLORS[ev.programa_code?.split('-')[0]] ?? 'bg-muted-foreground')} />
                        <p className="text-[9px] text-foreground truncate flex-1">{ev.programa_code}</p>
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[ev.status] ?? 'bg-muted-foreground')} />
                      </div>
                    ))}
                    {dayEvents.length > 2 && <p className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 2}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Staff workload sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> Carga por Terapeuta
            </h3>
            <div className="space-y-3">
              {staffWithSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin datos de personal</p>
              ) : (
                staffWithSessions.map(staff => {
                  const wl = staffWorkload.get(staff.user_id) ?? { total: 0, completed: 0 }
                  const pct = wl.total > 0 ? Math.round((wl.completed / wl.total) * 100) : 0
                  const isSelected = selectedStaffId === staff.user_id
                  return (
                    <button
                      key={staff.user_id}
                      onClick={() => setSelectedStaffId(isSelected ? 'all' : staff.user_id)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg border transition-colors',
                        isSelected ? 'border-teal-300 bg-teal-50 dark:bg-teal-900/20' : 'border-transparent hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{staff.nombre}</p>
                        <span className="text-[10px] text-muted-foreground">{wl.total} ses.</span>
                      </div>
                      {staff.especialidad && <p className="text-[10px] text-muted-foreground mb-1.5">{staff.especialidad}</p>}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{pct}% completadas</p>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Day detail */}
          {selectedDate && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-foreground mb-3">{selectedDate}</h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Sin sesiones</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev: any) => {
                    const patientName = patients.find(p => p.id === ev.patient_id)?.nombre ?? '—'
                    const therapist = ev.therapist_name || profiles.find(p => p.user_id === ev.staff_id)?.nombre || '—'
                    return (
                      <div key={ev.id} className="p-2.5 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn('w-2 h-2 rounded-full', PROGRAM_COLORS[ev.programa_code?.split('-')[0]] ?? 'bg-muted-foreground')} />
                          <span className="text-xs font-semibold text-foreground">{ev.programa_code}</span>
                          <div className={cn('w-2 h-2 rounded-full ml-auto', STATUS_DOT[ev.status] ?? 'bg-muted-foreground')} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">Paciente: {patientName}</p>
                        <p className="text-[11px] text-muted-foreground">Terapeuta: {therapist}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
