import { useState, useEffect } from 'react'
import { Package, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePatient, useUpdatePatient } from '@/hooks/usePatients'
import { usePrograms } from '@/hooks/usePrograms'
import { useBundles } from '@/hooks/useBundles'
import { PHASE_LABELS, type Phase } from '../../types'
import { cn } from '../../lib/utils'

const PHASE_COLORS: Record<Phase, string> = {
  F1: 'bg-blue-100 text-blue-700 border-blue-200', F2: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  F3: 'bg-orange-100 text-orange-700 border-orange-200', F4: 'bg-red-100 text-red-700 border-red-200',
  F5: 'bg-purple-100 text-purple-700 border-purple-200', F6: 'bg-green-100 text-green-700 border-green-200',
  F7: 'bg-teal-100 text-teal-700 border-teal-200', F8: 'bg-slate-100 text-slate-700 border-slate-200',
}

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  FX: 'bg-blue-50 text-blue-700 border-blue-100', PS: 'bg-purple-50 text-purple-700 border-purple-100',
  NU: 'bg-green-50 text-green-700 border-green-100', EO: 'bg-pink-50 text-pink-700 border-pink-100',
  TS: 'bg-orange-50 text-orange-700 border-orange-100',
}

export function BundleManager() {
  const { selectedPatientId } = useStore()
  const { data: patient } = usePatient(selectedPatientId)
  const { data: programs = [] } = usePrograms()
  const { data: bundles = [] } = useBundles()
  const updatePatient = useUpdatePatient()

  const [expandedBundle, setExpandedBundle] = useState<string | null>(null)
  const [justAssigned, setJustAssigned] = useState<string | null>(null)

  useEffect(() => { if (justAssigned) { const t = setTimeout(() => setJustAssigned(null), 3000); return () => clearTimeout(t) } }, [justAssigned])

  function handleAssign(bundleCode: string, programCodes: string[]) {
    if (!patient) return
    const existingBundles = (patient.assigned_bundles ?? []).includes(bundleCode)
      ? patient.assigned_bundles ?? []
      : [...(patient.assigned_bundles ?? []), bundleCode]
    const existingPrograms = new Set(patient.assigned_programs ?? [])
    programCodes.forEach(c => existingPrograms.add(c))
    updatePatient.mutate({
      id: patient.id,
      assigned_bundles: existingBundles,
      assigned_programs: Array.from(existingPrograms),
    })
    setJustAssigned(bundleCode)
  }

  if (!patient) return <div className="p-6 text-slate-400">Selecciona un paciente</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center"><Package size={18} className="text-amber-600" /></div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Gestor de Bundles Clínicos</h2>
          <p className="text-xs text-slate-500">Paciente: {patient.nombre}</p>
        </div>
      </div>

      {justAssigned && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" /><p className="text-sm text-green-700">Bundle asignado correctamente</p>
        </div>
      )}

      <div className="space-y-4">
        {bundles.map(bundle => {
          const isAssigned = (patient.assigned_bundles ?? []).includes(bundle.code)
          const isExpanded = expandedBundle === bundle.code
          const bundlePrograms = programs.filter(p => (bundle.program_codes ?? []).includes(p.code))
          const phase = (bundle.phase ?? 'F1') as Phase

          return (
            <div key={bundle.code} className={cn('bg-white rounded-xl border overflow-hidden transition-all', isAssigned ? 'border-green-300 shadow-sm' : 'border-slate-200')}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border', isAssigned ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600')}>
                      {bundle.code.replace('PC-', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800">{bundle.code}</h3>
                        <span className="text-sm font-semibold text-slate-700">– {bundle.nombre}</span>
                        {isAssigned && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Activo</span>}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{bundle.descripcion}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PHASE_COLORS[phase])}>{phase} – {PHASE_LABELS[phase]}</span>
                        <span className="text-xs text-slate-400">{(bundle.program_codes ?? []).length} programas</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedBundle(isExpanded ? null : bundle.code)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                      Ver programas {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => handleAssign(bundle.code, bundle.program_codes ?? [])} disabled={isAssigned} className={cn('flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors', isAssigned ? 'bg-green-100 text-green-700' : 'bg-amber-500 text-white hover:bg-amber-600')}>
                      {isAssigned ? <><CheckCircle size={14} /> Asignado</> : <><Zap size={14} /> Asignar</>}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(bundle.program_codes ?? []).map(code => (
                    <span key={code} className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', PROGRAM_TYPE_COLORS[code.split('-')[0]])}>{code}</span>
                  ))}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="text-xs font-semibold text-slate-600 mb-3">Programas incluidos en {bundle.code}</h4>
                  <div className="space-y-2">
                    {bundlePrograms.map(prog => (
                      <div key={prog.code} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', PROGRAM_TYPE_COLORS[prog.tipo])}>{prog.tipo}</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{prog.code} – {prog.nombre}</p>
                            <p className="text-xs text-slate-400">{prog.descripcion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
