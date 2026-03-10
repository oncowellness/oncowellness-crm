import { useState } from 'react'
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'
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

export function PromsForm({ instrument, patientId, onComplete }: PromsFormProps) {
  const { user } = useAuth()
  const createTest = useCreateClinicalTest()
  const defaultVal = instrument.likert[0]?.value ?? 0
  const [answers, setAnswers] = useState<number[]>(new Array(instrument.questions.length).fill(defaultVal))
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitted, setSubmitted] = useState(false)

  const score = computeScore(instrument, answers)
  const band = getSeverityBand(instrument, score)
  const redFlag = isRedFlag(instrument, score)

  function setAnswer(index: number, value: number) {
    setAnswers(prev => { const next = [...prev]; next[index] = value; return next })
  }

  function submit() {
    if (!patientId) return
    createTest.mutate({
      patient_id: patientId,
      tipo: instrument.key as any,
      valor_numerico: score,
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
      <div className={cn('rounded-xl border p-4 flex items-center gap-3', redFlag ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300')}>
        {redFlag ? <AlertTriangle size={20} className="text-red-600" /> : <CheckCircle size={20} className="text-green-600" />}
        <div>
          <p className={cn('text-sm font-semibold', redFlag ? 'text-red-700' : 'text-green-700')}>
            {instrument.shortName} registrado — {score} {instrument.unit}
          </p>
          {redFlag && instrument.redFlagMessage && (
            <p className="text-xs text-red-600">{instrument.redFlagMessage}</p>
          )}
        </div>
      </div>
    )
  }

  const useLargeScale = instrument.likert.length > 5

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{instrument.name}</h3>
        <p className="text-xs text-muted-foreground">{instrument.description}</p>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">
          Período de referencia: <strong>{instrument.timeframe}</strong>
        </p>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Fecha de evaluación</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-3">
        {instrument.questions.map((q, i) => (
          <div key={i} className={cn(
            'rounded-lg p-3 border transition-colors',
            answers[i] !== defaultVal ? 'border-primary/30 bg-primary/5' : 'border-border'
          )}>
            <div className="flex items-start gap-3 mb-2">
              <span className="text-xs text-muted-foreground w-5 shrink-0 mt-0.5 font-medium">{i + 1}.</span>
              <p className="text-sm text-foreground flex-1">{q}</p>
            </div>
            {useLargeScale ? (
              <div className="ml-8">
                <input
                  type="range"
                  min={instrument.likert[0].value}
                  max={instrument.likert[instrument.likert.length - 1].value}
                  value={answers[i]}
                  onChange={e => setAnswer(i, Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{instrument.likert[0].label}</span>
                  <span className="font-bold text-foreground text-xs">{answers[i]}</span>
                  <span>{instrument.likert[instrument.likert.length - 1].label}</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-1.5 ml-8 flex-wrap">
                {instrument.likert.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(i, opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      answers[i] === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-input hover:border-primary/50'
                    )}
                  >
                    {opt.value} – {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Score preview */}
      <div className={cn(
        'p-4 rounded-xl border flex items-center justify-between',
        redFlag ? 'bg-red-50 border-red-300' : 'bg-muted border-border'
      )}>
        <div>
          <p className="text-sm text-muted-foreground">Puntuación</p>
          <p className={cn('text-3xl font-bold', redFlag ? 'text-red-600' : 'text-foreground')}>
            {score}
            <span className="text-sm font-normal text-muted-foreground"> / {instrument.maxScore} {instrument.unit}</span>
          </p>
        </div>
        {band && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Severidad</p>
            <p className={cn('text-sm font-semibold', band.textClass)}>{band.label}</p>
            {redFlag && instrument.redFlagMessage && (
              <p className="text-xs text-red-600 font-bold mt-1">⚡ {instrument.redFlagMessage}</p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={submit}
        disabled={createTest.isPending}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:opacity-90 font-medium text-sm disabled:opacity-60"
      >
        {createTest.isPending ? 'Registrando...' : `Registrar ${instrument.shortName}`}
      </button>
    </div>
  )
}
