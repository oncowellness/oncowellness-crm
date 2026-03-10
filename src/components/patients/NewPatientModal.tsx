import { useState, useCallback } from 'react'
import { X, UserPlus, ChevronRight, ChevronLeft, Check, AlertCircle, MapPin, CreditCard } from 'lucide-react'
import { useCreatePatient } from '@/hooks/usePatients'
import { PHASE_LABELS, type Phase, type MindState } from '../../types'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { SPAIN_PROVINCES, COUNTRIES, ID_TYPES } from '@/lib/spainGeo'
import { validateDNI, validateNIE } from '@/lib/identityValidation'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

type Step = 1 | 2 | 3 | 4

const MIND_STATES: MindState[] = ['Activo', 'Ansioso', 'Depresivo', 'Resiliente', 'Vulnerable']
const PHASES = Object.keys(PHASE_LABELS) as Phase[]
const CANCER_TYPES = [
  'Mama', 'Pulmón', 'Colon/Recto', 'Próstata', 'Linfoma', 'Leucemia',
  'Melanoma', 'Riñón', 'Vejiga', 'Ovario', 'Útero', 'Páncreas', 'Hígado', 'Otro',
]

const STEP_LABELS: Record<Step, string> = {
  1: 'Datos Personales',
  2: 'Info. Administrativa',
  3: 'Datos Clínicos',
  4: 'Journey y Estado',
}

function Field({
  label, required, children, error,
}: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'
const inputErrorCls = 'w-full text-sm border border-red-300 rounded-lg px-3 py-2 bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-400'

export function NewPatientModal({ onClose, onCreated }: Props) {
  const createPatient = useCreatePatient()
  const [step, setStep] = useState<Step>(1)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Step 1 - Personal
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('F')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2 - Administrative
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressExtra, setAddressExtra] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [cityName, setCityName] = useState('')
  const [provinceName, setProvinceName] = useState('')
  const [countryCode, setCountryCode] = useState('ES')

  // Step 3 - Clinical
  const [diagnosis, setDiagnosis] = useState('')
  const [cancerType, setCancerType] = useState('')
  const [stage, setStage] = useState('')
  const [oncologist, setOncologist] = useState('')
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split('T')[0])

  // Step 4 - Journey
  const [currentPhase, setCurrentPhase] = useState<Phase>('F1')
  const [mindState, setMindState] = useState<MindState>('Activo')

  // Validations
  const idNumberError = (() => {
    if (!touched.idNumber || !idNumber.trim()) return undefined
    const val = idNumber.toUpperCase().trim()
    if (idType === 'DNI' && !validateDNI(val)) return 'DNI no válido (8 dígitos + letra)'
    if (idType === 'NIE' && !validateNIE(val)) return 'NIE no válido (X/Y/Z + 7 dígitos + letra)'
    if (idType === 'Pasaporte' && val.length < 5) return 'Nº pasaporte demasiado corto'
    return undefined
  })()

  const postalCodeError = touched.postalCode && postalCode.trim() && !/^\d{5}$/.test(postalCode.trim())
    ? 'Código postal: 5 dígitos' : undefined

  const validations = {
    name: touched.name && !name.trim() ? 'El nombre es obligatorio' : undefined,
    age: touched.age && (!age.trim() || parseInt(age) < 1 || parseInt(age) > 120) ? 'Edad entre 1 y 120' : undefined,
    email: touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Email no válido' : undefined,
    diagnosis: touched.diagnosis && !diagnosis.trim() ? 'El diagnóstico es obligatorio' : undefined,
    cancerType: touched.cancerType && !cancerType.trim() ? 'Selecciona un tipo' : undefined,
    oncologist: touched.oncologist && !oncologist.trim() ? 'El oncólogo es obligatorio' : undefined,
  }

  const step1Valid = name.trim().length > 0 && age.trim().length > 0 && parseInt(age) >= 1 && parseInt(age) <= 120 && (!email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  const step2Valid = !idNumberError && !postalCodeError // Admin fields are all optional
  const step3Valid = diagnosis.trim().length > 0 && cancerType.trim().length > 0 && oncologist.trim().length > 0

  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : true

  function markTouched(...fields: string[]) {
    setTouched(t => { const n = { ...t }; fields.forEach(f => n[f] = true); return n })
  }

  function tryNext() {
    if (step === 1) {
      markTouched('name', 'age', 'email')
      if (!step1Valid) return
    } else if (step === 2) {
      markTouched('idNumber', 'postalCode')
      if (!step2Valid) return
    } else if (step === 3) {
      markTouched('diagnosis', 'cancerType', 'oncologist')
      if (!step3Valid) return
    }
    setStep(s => (s + 1) as Step)
  }

  function buildInsert() {
    return {
      codigo: `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      nombre: name.trim(),
      edad: parseInt(age) || null,
      genero: gender,
      email: email.trim() || null,
      telefono: phone.trim() || null,
      identification_type: idType || null,
      identification_number: idNumber.toUpperCase().trim() || null,
      address_street: addressStreet.trim() || null,
      address_extra: addressExtra.trim() || null,
      postal_code: postalCode.trim() || null,
      city_name: cityName.trim() || null,
      province_name: provinceName || null,
      country_code: countryCode || 'ES',
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
    if (step === 1) markTouched('name', 'age', 'email')
    if (!step1Valid) return
    try {
      const result = await createPatient.mutateAsync(buildInsert())
      toast.success('Paciente creado correctamente')
      onCreated(result.id)
    } catch (e) {
      console.error('Error creating patient:', e)
      toast.error('Error al crear el paciente')
    }
  }

  const allSteps = [1, 2, 3, 4] as Step[]

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
        <div className="flex items-center px-6 pt-4 pb-2 gap-1">
          {allSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className={cn(
                'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0',
                step > s ? 'bg-teal-500 text-white' : step === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
              )}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className={cn(
                'text-[10px] font-medium whitespace-nowrap',
                step === s ? 'text-teal-700' : 'text-slate-400'
              )}>
                {STEP_LABELS[s]}
              </span>
              {i < 3 && <div className={cn('flex-1 h-px', step > s ? 'bg-teal-400' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <Field label="Nombre completo" required error={validations.name}>
                <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} onBlur={() => markTouched('name')} placeholder="Ej. Ana Martínez López" className={validations.name ? inputErrorCls : inputCls} maxLength={100} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Edad" required error={validations.age}>
                  <input type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} onBlur={() => markTouched('age')} placeholder="Ej. 54" className={validations.age ? inputErrorCls : inputCls} />
                </Field>
                <Field label="Sexo">
                  <div className="flex gap-2 mt-0.5">
                    {(['F', 'M'] as const).map(g => (
                      <button key={g} onClick={() => setGender(g)} className={cn('flex-1 text-sm py-2 rounded-lg border font-medium transition-colors', gender === g ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300')}>{g === 'F' ? 'Mujer' : 'Hombre'}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Email" error={validations.email}><input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => markTouched('email')} placeholder="paciente@email.com" className={validations.email ? inputErrorCls : inputCls} maxLength={255} /></Field>
              <Field label="Teléfono"><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="612 345 678" className={inputCls} maxLength={20} /></Field>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-slate-600">Documento de Identidad</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de documento">
                  <select value={idType} onChange={e => setIdType(e.target.value)} className={inputCls}>
                    <option value="">— Seleccionar —</option>
                    {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Número" error={idNumberError}>
                  <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())} onBlur={() => markTouched('idNumber')}
                    placeholder={idType === 'DNI' ? '12345678A' : idType === 'NIE' ? 'X1234567A' : 'Nº documento'}
                    className={idNumberError ? inputErrorCls : inputCls} maxLength={20} />
                </Field>
              </div>

              <div className="flex items-center gap-2 mt-4 mb-1">
                <MapPin size={14} className="text-teal-600" />
                <p className="text-xs font-semibold text-slate-600">Dirección</p>
              </div>
              <Field label="Calle y número">
                <input type="text" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} placeholder="Calle Mayor, 12" className={inputCls} maxLength={200} />
              </Field>
              <Field label="Piso / Puerta / Escalera">
                <input type="text" value={addressExtra} onChange={e => setAddressExtra(e.target.value)} placeholder="3º B, Esc. Izda." className={inputCls} maxLength={100} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Código Postal" error={postalCodeError}>
                  <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} onBlur={() => markTouched('postalCode')} placeholder="28001" className={postalCodeError ? inputErrorCls : inputCls} maxLength={5} />
                </Field>
                <Field label="Ciudad">
                  <input type="text" value={cityName} onChange={e => setCityName(e.target.value)} placeholder="Madrid" className={inputCls} maxLength={100} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provincia">
                  <select value={provinceName} onChange={e => setProvinceName(e.target.value)} className={inputCls}>
                    <option value="">— Seleccionar —</option>
                    {SPAIN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="País">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className={inputCls}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Diagnóstico" required error={validations.diagnosis}><input autoFocus type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} onBlur={() => markTouched('diagnosis')} placeholder="Ej. Carcinoma ductal invasivo" className={validations.diagnosis ? inputErrorCls : inputCls} maxLength={200} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo de cáncer" required error={validations.cancerType}>
                  <select value={cancerType} onChange={e => { setCancerType(e.target.value); markTouched('cancerType') }} className={validations.cancerType ? inputErrorCls : inputCls}>
                    <option value="">— Seleccionar —</option>
                    {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Estadio TNM"><input type="text" value={stage} onChange={e => setStage(e.target.value)} placeholder="Ej. IIB, IIIA" className={inputCls} maxLength={20} /></Field>
              </div>
              <Field label="Oncólogo/a responsable" required error={validations.oncologist}><input type="text" value={oncologist} onChange={e => setOncologist(e.target.value)} onBlur={() => markTouched('oncologist')} placeholder="Ej. Dr. García Pérez" className={validations.oncologist ? inputErrorCls : inputCls} maxLength={100} /></Field>
              <Field label="Fecha de diagnóstico"><input type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)} className={inputCls} /></Field>
            </>
          )}

          {step === 4 && (
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
                  {idNumber && <div><span className="text-slate-400">{idType || 'ID'}:</span> <span className="text-slate-700">{idNumber}</span></div>}
                  {cityName && <div><span className="text-slate-400">Ciudad:</span> <span className="text-slate-700">{cityName}{provinceName && `, ${provinceName}`}</span></div>}
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
            {allSteps.map(s => (
              <div key={s} className={cn('w-2 h-2 rounded-full', step === s ? 'bg-teal-500' : 'bg-slate-200')} />
            ))}
          </div>
          {step < 4 ? (
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button onClick={handleSubmit} disabled={!step1Valid || createPatient.isPending} className="flex items-center gap-1.5 text-sm border border-teal-600 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Check size={14} /> Guardar ahora
                </button>
              )}
              <button onClick={tryNext} className="flex items-center gap-1.5 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
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
