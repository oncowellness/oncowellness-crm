import { useState } from 'react'
import { Info, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateClinicalTest } from '@/hooks/useClinicalTests'
import type { PromsInstrument } from '@/lib/promsDefinitions'
import { computeScore, getSeverityBand, isRedFlag } from '@/lib/promsDefinitions'

interface PromsFormProps {
  instrument: PromsInstrument
  patientId: string
  onComplete?: () => void
}

const QUESTIONS_PER_PAGE = 5

export function PromsForm({ instrument, patientId, onComplete }: PromsFormProps) {
  const { user } = useAuth()
  const createTest = useCreateClinicalTest()
  const defaultVal = instrument.likert[0]?.value ?? 0
  const [answers, setAnswers] = useState<number[]>(new Array(instrument.questions.length).fill(defaultVal))
  const [touched, setTouched] = useState<boolean[]>(new Array(instrument.questions.length).fill(false))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isBaseline, setIsBaseline] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(instrument.questions.length / QUESTIONS_PER_PAGE)
  const startIdx = page * QUESTIONS_PER_PAGE
  const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, instrument.questions.length)
  const currentQuestions = instrument.questions.slice(startIdx, endIdx)

  const score = computeScore(instrument, answers)
  const band = getSeverityBand(instrument, score)
  const redFlag = isRedFlag(instrument, score)

  const answeredCount = touched.filter(Boolean).length
  const progress = Math.round((answeredCount / instrument.questions.length) * 100)

  function setAnswer(globalIndex: number, value: number) {
    setAnswers(prev => { const next = [...prev]; next[globalIndex] = value; return next })
    setTouched(prev => { const next = [...prev]; next[globalIndex] = true; return next })
  }

  function submit() {
    if (!patientId) return
    createTest.mutate({
      patient_id: patientId,
      tipo: instrument.key as any,
      valor_numerico: score,
      is_baseline: isBaseline,
      valores_json: { answers: [...answers], severity: band?.key, date },
      staff_id: user?.id ?? null,
    }, {
      onSuccess: () => {
        setSubmitted(true)
        setTimeout(() => { setSubmitted(false); onComplete?.() }, 3000)
      }
    })
  }

  if (submitted) {
    return (
      <div className={cn(
        'rounded-xl border-2 p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300',
        redFlag ? 'bg-destructive/5 border-destructive/30' : 'bg-emerald-50 border-emerald-200'
      )}>
        {redFlag
          ? <AlertTriangle size={24} className="text-destructive shrink-0" />
          : <CheckCircle size={24} className="text-emerald-600 shrink-0" />
        }
        <div>
          <p className={cn('text-sm font-bold', redFlag ? 'text-destructive' : 'text-emerald-700')}>
            {instrument.shortName} registrado correctamente — {score} {instrument.unit}
          </p>
          {band && <p className="text-xs text-muted-foreground mt-0.5">Severidad: {band.label}</p>}
          {redFlag && instrument.redFlagMessage && (
            <p className="text-xs text-destructive font-semibold mt-1">⚡ {instrument.redFlagMessage}</p>
          )}
        </div>
      </div>
    )
  }

  const useLargeScale = instrument.likert.length > 5

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <Info size={16} className="text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          <p>Período de referencia: <strong className="text-foreground">{instrument.timeframe}</strong></p>
          <p className="mt-1">{instrument.questions.length} preguntas · Escala: {instrument.likert[0]?.label} → {instrument.likert[instrument.likert.length - 1]?.label}</p>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Fecha de evaluación</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="text-sm border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>

      {/* Baseline toggle — required for correct delta calculations in ClinicalTrends */}
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={isBaseline}
          onChange={e => setIsBaseline(e.target.checked)}
          className="w-4 h-4 accent-primary rounded"
        />
        <span className="text-xs font-medium text-muted-foreground">
          Medición basal (primera evaluación de referencia)
        </span>
      </label>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progreso</span>
          <span className="text-foreground font-bold">{answeredCount}/{instrument.questions.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions (paginated) */}
      <div className="space-y-3">
        {currentQuestions.map((q, localIdx) => {
          const globalIdx = startIdx + localIdx
          const isAnswered = touched[globalIdx]
          return (
            <div key={globalIdx} className={cn(
              'rounded-xl p-4 border-2 transition-all duration-200',
              isAnswered ? 'border-primary/20 bg-primary/[0.02]' : 'border-border'
            )}>
              <div className="flex items-start gap-3 mb-3">
                <span className={cn(
                  'text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold',
                  isAnswered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {globalIdx + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{q}</p>
              </div>

              {useLargeScale ? (
                <div className="ml-9">
                  <input
                    type="range"
                    min={instrument.likert[0].value}
                    max={instrument.likert[instrument.likert.length - 1].value}
                    value={answers[globalIdx]}
                    onChange={e => setAnswer(globalIdx, Number(e.target.value))}
                    className="w-full accent-primary h-2"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                    <span>{instrument.likert[0].label}</span>
                    <span className="font-bold text-foreground text-sm bg-primary/10 px-2 py-0.5 rounded-lg">{answers[globalIdx]}</span>
                    <span>{instrument.likert[instrument.likert.length - 1].label}</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1.5 ml-9 flex-wrap">
                  {instrument.likert.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(globalIdx, opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all duration-150',
                        answers[globalIdx] === opt.value && isAnswered
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                          : 'bg-background text-foreground border-input hover:border-primary/40 hover:bg-primary/5'
                      )}
                    >
                      <span className="font-bold">{opt.value}</span>
                      <span className="text-[10px] block opacity-75">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-3 py-2 rounded-xl hover:bg-muted"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  i === page ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-3 py-2 rounded-xl hover:bg-muted"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Score preview (sticky feel) */}
      <div className={cn(
        'p-5 rounded-xl border-2 flex items-center justify-between transition-colors',
        redFlag ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-border'
      )}>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Puntuación estimada</p>
          <p className={cn('text-3xl font-bold tabular-nums', redFlag ? 'text-destructive' : 'text-foreground')}>
            {score}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {instrument.maxScore} {instrument.unit}</span>
          </p>
        </div>
        {band && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Severidad</p>
            <span className={cn('inline-block text-xs font-bold px-3 py-1 rounded-full', band.bgClass, band.textClass)}>
              {band.label}
            </span>
            {redFlag && instrument.redFlagMessage && (
              <p className="text-[10px] text-destructive font-bold mt-1.5">⚡ {instrument.redFlagMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={createTest.isPending}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:opacity-90 font-semibold text-sm disabled:opacity-60 transition-opacity shadow-sm"
      >
        {createTest.isPending ? 'Registrando...' : `Registrar ${instrument.shortName}`}
      </button>
    </div>
  )
}
