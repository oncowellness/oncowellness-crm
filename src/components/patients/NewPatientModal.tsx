import { useState } from 'react'
import { X, UserPlus, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useCreatePatient } from '@/hooks/usePatients'
import { PHASE_LABELS, type Phase, type MindState } from '../../types'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

type Step = 1 | 2 | 3

const MIND_STATES: MindState[] = ['Activo', 'Ansioso', 'Depresivo', 'Resiliente', 'Vulnerable']
const PHASES = Object.keys(PHASE_LABELS) as Phase[]
const CANCER_TYPES = [
  'Mama', 'Pulmón', 'Colon/Recto', 'Próstata', 'Linfoma', 'Leucemia',
  'Melanoma', 'Riñón', 'Vejiga', 'Ovario', 'Útero', 'Páncreas', 'Hígado', 'Otro',
]

const STEP_LABELS: Record<Step, string> = {
  1: 'Datos Personales',
  2: 'Datos Clínicos',
  3: 'Journey y Estado',
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

export function NewPatientModal({ onClose, onCreated }: Props) {
  const createPatient = useCreatePatient()
  const [step, setStep] = useState<Step>(1)

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [diagnosis, setDiagnosis] = useState('')
  const [cancerType, setCancerType] = useState('')
  const [stage, setStage] = useState('')
  const [oncologist, setOncologist] = useState('')
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split('T')[0])

  const [currentPhase, setCurrentPhase] = useState<Phase>('F1')
  const [mindState, setMindState] = useState<MindState>('Activo')

  const step1Valid = name.trim().length > 0 && age.trim().length > 0
  const step2Valid = diagnosis.trim().length > 0 && cancerType.trim().length > 0 && oncologist.trim().length > 0
  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : true

  function buildInsert() {
    return {
      codigo: `P${Date.now().toString().slice(-6)}`,
      nombre: name.trim(),
      edad: parseInt(age) || null,
      genero: gender,
      email: email.trim() || null,
      telefono: phone.trim() || null,
      diagnostico: diagnosis.trim() || null,
      tipo_cancer: cancerType.trim() || null,
      estadio: stage.trim() || null,
      oncologo_referente: oncologist.trim() || null,
      fecha_diagnostico: diagnosisDate || null,
      fase_journey: currentPhase as any,
      mind_state: mindState as any,
      alert_status: 'verde' as any,
    }
  }

  async function handleSubmit() {
    try {
      const result = await createPatient.mutateAsync(buildInsert())
      onCreated(result.id)
    } catch (e) {
      console.error('Error creating patient:', e)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Nuevo Paciente</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center px-6 pt-4 pb-2 gap-2">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0',
                step > s ? 'bg-teal-500 text-white' : step === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              )}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                step === s ? 'text-teal-700' : 'text-slate-400'
              )}>
                {STEP_LABELS[s]}
              </span>
              {i < 2 && <div className={cn('flex-1 h-px', step > s ? 'bg-teal-400' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <Field label="Nombre completo" required>
                <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Ana Martínez López" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Edad" required>
                  <input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="Ej. 54" className={inputCls} />
                </Field>
                <Field label="Sexo">
                  <div className="flex gap-2 mt-0.5">
                    {(['F', 'M'] as const).map(g => (
                      <button key={g} onClick={() => setGender(g)} className={cn('flex-1 text-sm py-2 rounded-lg border font-medium transition-colors', gender === g ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300')}>{g === 'F' ? 'Mujer' : 'Hombre'}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="paciente@email.com" className={inputCls} /></Field>
              <Field label="Teléfono"><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="612 345 678" className={inputCls} /></Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Diagnóstico" required><input autoFocus type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Ej. Carcinoma ductal invasivo" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de cáncer" required>
                  <select value={cancerType} onChange={e => setCancerType(e.target.value)} className={inputCls}>
                    <option value="">— Seleccionar —</option>
                    {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Estadio TNM"><input type="text" value={stage} onChange={e => setStage(e.target.value)} placeholder="Ej. IIB, IIIA" className={inputCls} /></Field>
              </div>
              <Field label="Oncólogo/a responsable" required><input type="text" value={oncologist} onChange={e => setOncologist(e.target.value)} placeholder="Ej. Dr. García Pérez" className={inputCls} /></Field>
              <Field label="Fecha de diagnóstico"><input type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)} className={inputCls} /></Field>
            </>
          )}
          {step === 3 && (
            <>
              <Field label="Fase del Journey">
                <div className="grid grid-cols-4 gap-2">
                  {PHASES.map(phase => (
                    <button key={phase} onClick={() => setCurrentPhase(phase)} className={cn('text-xs py-2.5 px-2 rounded-lg border font-medium transition-colors text-center', currentPhase === phase ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300')}>
                      <div className="font-bold">{phase}</div>
                      <div className="text-[10px] leading-tight mt-0.5 opacity-80">{PHASE_LABELS[phase].split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Estado mental (Mind State)">
                <div className="flex flex-wrap gap-2">
                  {MIND_STATES.map(ms => (
                    <button key={ms} onClick={() => setMindState(ms)} className={cn('text-sm px-3 py-1.5 rounded-full border font-medium transition-colors', mindState === ms ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300')}>{ms}</button>
                  ))}
                </div>
              </Field>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mt-2">
                <p className="text-xs font-semibold text-slate-600 mb-2">Resumen del nuevo paciente</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-slate-400">Nombre:</span> <span className="text-slate-700 font-medium">{name}</span></div>
                  <div><span className="text-slate-400">Edad:</span> <span className="text-slate-700">{age} años · {gender === 'F' ? 'Mujer' : 'Hombre'}</span></div>
                  <div><span className="text-slate-400">Cáncer:</span> <span className="text-slate-700">{cancerType} {stage && `(${stage})`}</span></div>
                  <div><span className="text-slate-400">Oncólogo:</span> <span className="text-slate-700">{oncologist}</span></div>
                  <div><span className="text-slate-400">Fase:</span> <span className="text-slate-700">{currentPhase} – {PHASE_LABELS[currentPhase]}</span></div>
                  <div><span className="text-slate-400">Mind state:</span> <span className="text-slate-700">{mindState}</span></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as Step)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50">
            <ChevronLeft size={14} />{step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as Step[]).map(s => (
              <div key={s} className={cn('w-2 h-2 rounded-full', step === s ? 'bg-teal-500' : 'bg-slate-200')} />
            ))}
          </div>
          {step < 3 ? (
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button onClick={handleSubmit} disabled={!step1Valid || createPatient.isPending} className="flex items-center gap-1.5 text-sm border border-teal-600 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Check size={14} /> Guardar ahora
                </button>
              )}
              <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext} className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <button onClick={handleSubmit} disabled={createPatient.isPending} className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-60">
              <Check size={14} /> {createPatient.isPending ? 'Creando...' : 'Crear Paciente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
