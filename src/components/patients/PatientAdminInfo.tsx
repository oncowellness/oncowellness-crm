import { useState } from 'react'
import { Pencil, X, Save, MapPin, CreditCard } from 'lucide-react'
import { useUpdatePatient } from '@/hooks/usePatients'
import { adminInfoSchema, type AdminInfoData } from '@/lib/identityValidation'
import { SPAIN_PROVINCES, COUNTRIES, ID_TYPES } from '@/lib/spainGeo'
import { cn } from '@/lib/utils'

const iCls = 'w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'

interface Props {
  patient: {
    id: string
    identification_type?: string | null
    identification_number?: string | null
    address_street?: string | null
    address_extra?: string | null
    postal_code?: string | null
    city_name?: string | null
    province_name?: string | null
    country_code?: string | null
  }
}

export function PatientAdminInfo({ patient }: Props) {
  const updatePatient = useUpdatePatient()
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<AdminInfoData>({
    identification_type: (patient.identification_type as any) ?? null,
    identification_number: patient.identification_number ?? null,
    address_street: patient.address_street ?? null,
    address_extra: patient.address_extra ?? null,
    postal_code: patient.postal_code ?? null,
    city_name: patient.city_name ?? null,
    province_name: patient.province_name ?? null,
    country_code: patient.country_code ?? 'ES',
  })

  function startEdit() {
    setDraft({
      identification_type: (patient.identification_type as any) ?? null,
      identification_number: patient.identification_number ?? null,
      address_street: patient.address_street ?? null,
      address_extra: patient.address_extra ?? null,
      postal_code: patient.postal_code ?? null,
      city_name: patient.city_name ?? null,
      province_name: patient.province_name ?? null,
      country_code: patient.country_code ?? 'ES',
    })
    setErrors({})
    setEditing(true)
  }

  function save() {
    const result = adminInfoSchema.safeParse(draft)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(e => {
        const key = e.path.join('.')
        fieldErrors[key] = e.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    updatePatient.mutate({ id: patient.id, ...result.data })
    setEditing(false)
  }

  const set = (key: keyof AdminInfoData, val: string | null) =>
    setDraft(d => ({ ...d, [key]: val || null }))

  const countryName = COUNTRIES.find(c => c.code === patient.country_code)?.name ?? patient.country_code

  if (!editing) {
    const hasId = patient.identification_number
    const hasAddr = patient.address_street || patient.city_name
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700">Información Administrativa</h3>
          </div>
          <button onClick={startEdit} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50">
            <Pencil size={12} /> Editar
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Identificación</p>
            {hasId ? (
              <p className="text-xs text-slate-700">
                <span className="font-medium">{patient.identification_type}:</span> {patient.identification_number}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin documento registrado</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Dirección</p>
            {hasAddr ? (
              <div className="text-xs text-slate-700 space-y-0.5">
                {patient.address_street && <p>{patient.address_street}</p>}
                {patient.address_extra && <p>{patient.address_extra}</p>}
                <p>
                  {[patient.postal_code, patient.city_name].filter(Boolean).join(' ')}
                  {patient.province_name && `, ${patient.province_name}`}
                </p>
                {countryName && <p>{countryName}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Sin dirección registrada</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-teal-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-700">Información Administrativa</h3>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50">
            <X size={12} /> Cancelar
          </button>
          <button onClick={save} className="flex items-center gap-1 text-xs text-white bg-teal-600 px-2.5 py-1 rounded-lg hover:bg-teal-700">
            <Save size={12} /> Guardar
          </button>
        </div>
      </div>

      {/* Identification */}
      <div className="mb-4">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Documento de Identidad</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Tipo</label>
            <select className={iCls} value={draft.identification_type ?? ''} onChange={e => set('identification_type', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Número</label>
            <input className={cn(iCls, errors.identification_number && 'border-red-400')} value={draft.identification_number ?? ''}
              onChange={e => set('identification_number', e.target.value.toUpperCase())}
              placeholder={draft.identification_type === 'DNI' ? '12345678A' : draft.identification_type === 'NIE' ? 'X1234567A' : 'Nº Pasaporte'}
            />
            {errors.identification_number && <p className="text-[10px] text-red-500 mt-0.5">{errors.identification_number}</p>}
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
          <MapPin size={10} /> Dirección
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Calle y número</label>
            <input className={iCls} value={draft.address_street ?? ''} onChange={e => set('address_street', e.target.value)} placeholder="Calle Mayor, 12" />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Piso / Puerta / Escalera</label>
            <input className={iCls} value={draft.address_extra ?? ''} onChange={e => set('address_extra', e.target.value)} placeholder="3º B, Esc. Izda." />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Código Postal</label>
            <input className={cn(iCls, errors.postal_code && 'border-red-400')} value={draft.postal_code ?? ''} onChange={e => set('postal_code', e.target.value)} placeholder="28001" maxLength={5} />
            {errors.postal_code && <p className="text-[10px] text-red-500 mt-0.5">{errors.postal_code}</p>}
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Ciudad</label>
            <input className={iCls} value={draft.city_name ?? ''} onChange={e => set('city_name', e.target.value)} placeholder="Madrid" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Provincia</label>
            <select className={iCls} value={draft.province_name ?? ''} onChange={e => set('province_name', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {SPAIN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-0.5">País</label>
            <select className={iCls} value={draft.country_code ?? 'ES'} onChange={e => set('country_code', e.target.value)}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
