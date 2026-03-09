import { useState, useEffect } from 'react'
import { BookOpen, Send, CheckCircle, MessageSquare, FileText, Video, Package, Clock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient } from '@/hooks/usePatients'
import { useContentItems } from '@/hooks/useContentItems'
import { usePatientContent, useSendContent } from '@/hooks/usePatientContent'
import { cn } from '../../lib/utils'
import { PHASE_LABELS, type Phase } from '../../types'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Phase-based content rules (configuration logic)
const PHASE_CONTENT_RULES: Record<string, string[]> = {
  F1: ['LB-01', 'LB-02', 'LB-05'],
  F2: ['LB-01', 'LB-02', 'LB-05'],
  F3: ['DC-01', 'LB-03', 'LB-05'],
  F4: ['DC-01', 'LB-05'],
  F5: ['LB-05'],
  F6: ['LB-04', 'LB-05'],
  F7: ['LB-04', 'LB-05'],
  F8: ['DC-02', 'LB-05'],
}

// Empathic reminder templates by Mind State
const REMINDER_TEMPLATES: Record<string, string> = {
  Activo: 'Hola {nombre}, te recordamos tu cita del {fecha}. ¡Eres una inspiración con tu actitud positiva! Nos vemos pronto.',
  Ansioso: 'Hola {nombre}, te recordamos tu cita del {fecha}. Entendemos que este proceso puede generar inquietud — nuestro equipo estará encantado de acompañarte.',
  Depresivo: 'Hola {nombre}, te pensamos y te recordamos tu cita del {fecha}. Estamos aquí para ti, cada paso cuenta.',
  Resiliente: 'Hola {nombre}, te recordamos tu cita del {fecha}. Tu fortaleza es admirable. Seguimos contigo en este camino.',
  Vulnerable: 'Hola {nombre}, con todo el cariño te recordamos tu cita del {fecha}. Cuídate mucho, y recuerda que no estás solo/a.',
}

type ContentType = 'manual' | 'kit' | 'guia' | 'cuaderno' | 'video'

const CONTENT_TYPE_CONFIG: Record<ContentType, { icon: React.ReactNode; color: string; bg: string }> = {
  manual: { icon: <BookOpen size={14} />, color: 'text-blue-600', bg: 'bg-blue-100' },
  kit: { icon: <Package size={14} />, color: 'text-orange-600', bg: 'bg-orange-100' },
  guia: { icon: <FileText size={14} />, color: 'text-green-600', bg: 'bg-green-100' },
  cuaderno: { icon: <FileText size={14} />, color: 'text-purple-600', bg: 'bg-purple-100' },
  video: { icon: <Video size={14} />, color: 'text-red-600', bg: 'bg-red-100' },
}

export function EmpowermentModule() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: contentItems = [] } = useContentItems()
  const { data: patientContent = [] } = usePatientContent(selectedPatientId ?? undefined)
  const sendContent = useSendContent()

  if (!patient) return <div className="p-6 text-muted-foreground">Selecciona un paciente</div>

  const currentPhase = patient.fase_journey as Phase
  const recommendedCodes = PHASE_CONTENT_RULES[currentPhase] ?? []
  const recommendedItems = contentItems.filter(c => recommendedCodes.includes(c.code))

  // Build a set of already-sent content_item IDs for quick lookup
  const sentContentIds = new Set(patientContent.map((pc: any) => pc.content_id))
  const sentContentByItemId = new Map(patientContent.map((pc: any) => [pc.content_id, pc]))

  const reminderTemplate = REMINDER_TEMPLATES[patient.mind_state ?? 'Activo'] ?? REMINDER_TEMPLATES['Activo']
  const reminderText = reminderTemplate
    .replace('{nombre}', patient.nombre.split(' ')[0])
    .replace('{fecha}', 'próxima cita')

  function handleSend(contentItemId: string, code: string) {
    if (sentContentIds.has(contentItemId)) {
      toast.info('Este contenido ya fue enviado a este paciente')
      return
    }
    sendContent.mutate(
      { patientId: patient!.id, contentId: contentItemId },
      {
        onSuccess: () => toast.success(`Contenido ${code} enviado correctamente`),
        onError: () => toast.error('Error al enviar contenido'),
      }
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><BookOpen size={18} className="text-emerald-600" /></div>
        <div>
          <h2 className="text-base font-bold text-foreground">Motor de Empoderamiento</h2>
          <p className="text-xs text-muted-foreground">Paciente: {patient.nombre} · Fase {currentPhase} – {PHASE_LABELS[currentPhase]}</p>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {patientContent.length} contenidos entregados
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-teal-500 rounded-full" />
          <h3 className="text-sm font-semibold text-foreground">Recomendados para {currentPhase} – {PHASE_LABELS[currentPhase]}</h3>
        </div>
        <div className="space-y-3">
          {recommendedItems.map(item => {
            const tipo = (item.tipo ?? 'manual') as ContentType
            const typeConfig = CONTENT_TYPE_CONFIG[tipo] ?? CONTENT_TYPE_CONFIG.manual
            const isSent = sentContentIds.has(item.id)
            const sentRecord = sentContentByItemId.get(item.id)
            return (
              <div key={item.code} className={cn('flex items-start justify-between gap-4 p-3 rounded-lg border bg-card', isSent && 'border-green-200 bg-green-50/50')}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeConfig.bg)}>
                    <span className={typeConfig.color}>{typeConfig.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground"><span className="text-teal-600 mr-1">{item.code}</span>{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    {isSent && sentRecord?.sent_date && (
                      <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Enviado el {format(new Date(sentRecord.sent_date), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSend(item.id, item.code)}
                  disabled={isSent || sendContent.isPending}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg shrink-0',
                    isSent
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  )}
                >
                  {isSent ? <><CheckCircle size={12} /> Enviado</> : <><Send size={12} /> Enviar</>}
                </button>
              </div>
            )
          })}
          {recommendedItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No hay contenido para esta fase</p>}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4"><MessageSquare size={16} className="text-teal-600" /><h3 className="text-sm font-semibold text-foreground">Recordatorio Empático</h3></div>
        <div className="bg-muted rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Tono adaptado al estado mental: <strong className="text-foreground">{patient.mind_state}</strong></p>
          <div className="bg-card rounded-lg border p-3 mt-2">
            <p className="text-sm text-foreground italic">"{reminderText}"</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"><Send size={14} /> Enviar Recordatorio</button>
      </div>

      <div className="bg-card rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Biblioteca Completa</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {contentItems.map(item => {
            const tipo = (item.tipo ?? 'manual') as ContentType
            const typeConfig = CONTENT_TYPE_CONFIG[tipo] ?? CONTENT_TYPE_CONFIG.manual
            const isRecommended = recommendedCodes.includes(item.code)
            const isSent = sentContentIds.has(item.id)
            const sentRecord = sentContentByItemId.get(item.id)
            return (
              <div key={item.code} className={cn('flex items-start justify-between gap-3 p-3 rounded-lg border', isRecommended ? 'border-teal-200 bg-teal-50' : '', isSent && !isRecommended ? 'border-green-200 bg-green-50/50' : '')}>
                <div className="flex items-start gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', typeConfig.bg)}><span className={typeConfig.color}>{typeConfig.icon}</span></div>
                  <div>
                    <p className="text-xs font-semibold text-foreground"><span className="text-teal-600 mr-1">{item.code}</span>{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Fases: {(item.phases ?? []).join(', ')}
                      {isRecommended && <span className="ml-2 text-teal-600">★ Recomendado</span>}
                      {isSent && sentRecord?.sent_date && (
                        <span className="ml-2 text-green-600">✓ {format(new Date(sentRecord.sent_date), 'dd/MM/yy')}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSend(item.id, item.code)}
                  disabled={isSent || sendContent.isPending}
                  className={cn(
                    'shrink-0 text-[11px] px-2 py-1 rounded-lg',
                    isSent
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-600'
                  )}
                >
                  {isSent ? '✓' : 'Enviar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
