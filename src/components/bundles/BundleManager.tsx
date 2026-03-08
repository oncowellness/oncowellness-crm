import { useState, useEffect } from 'react'
import { Package, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { BUNDLES, PROGRAMS } from '../../data/programs'
import { PHASE_LABELS, type Phase } from '../../types'
import { cn } from '../../lib/utils'

const PHASE_COLORS: Record<Phase, string> = {
  F1: 'bg-blue-100 text-blue-700 border-blue-200',
  F2: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  F3: 'bg-orange-100 text-orange-700 border-orange-200',
  F4: 'bg-red-100 text-red-700 border-red-200',
  F5: 'bg-purple-100 text-purple-700 border-purple-200',
  F6: 'bg-green-100 text-green-700 border-green-200',
  F7: 'bg-teal-100 text-teal-700 border-teal-200',
  F8: 'bg-slate-100 text-slate-700 border-slate-200',
}

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  FX: 'bg-blue-50 text-blue-700 border-blue-100',
  PS: 'bg-purple-50 text-purple-700 border-purple-100',
  NU: 'bg-green-50 text-green-700 border-green-100',
  EO: 'bg-pink-50 text-pink-700 border-pink-100',
  TS: 'bg-orange-50 text-orange-700 border-orange-100',
}

export function BundleManager() {
  const { patients, selectedPatientId, assignBundle } = useStore()
  const patient = patients.find(p => p.id === selectedPatientId) ?? patients[0]

  const [expandedBundle, setExpandedBundle] = useState<string | null>(null)
  const [justAssigned, setJustAssigned] = useState<string | null>(null)

  useEffect(() => {
    if (justAssigned) {
      const timer = setTimeout(() => setJustAssigned(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [justAssigned])

  function handleAssign(bundleCode: string, programCodes: string[]) {
    if (!patient) return
    assignBundle(patient.id, bundleCode, programCodes)
    setJustAssigned(bundleCode)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
          <Package size={18} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Gestor de Bundles Clínicos</h2>
          <p className="text-xs text-slate-500">
            {patient ? `Paciente: ${patient.name}` : 'Sin paciente seleccionado'}
          </p>
        </div>
      </div>

      {justAssigned && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <p className="text-sm text-green-700">Bundle asignado y programas activados correctamente</p>
        </div>
      )}

      {/* Bundle cards */}
      <div className="space-y-4">
        {BUNDLES.map(bundle => {
          const isAssigned = patient?.assignedBundles.includes(bundle.code) ?? false
          const isExpanded = expandedBundle === bundle.code
          const bundlePrograms = PROGRAMS.filter(p => bundle.programs.includes(p.code))

          return (
            <div
              key={bundle.code}
              className={cn(
                'bg-white rounded-xl border overflow-hidden transition-all',
                isAssigned ? 'border-green-300 shadow-sm' : 'border-slate-200',
              )}
            >
              {/* Bundle header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border',
                      isAssigned ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                    )}>
                      {bundle.code.replace('PC-', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-800">{bundle.code}</h3>
                        <span className="text-sm font-semibold text-slate-700">– {bundle.name}</span>
                        {isAssigned && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{bundle.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PHASE_COLORS[bundle.phase])}>
                          {bundle.phase} – {PHASE_LABELS[bundle.phase]}
                        </span>
                        <span className="text-xs text-slate-400">{bundle.programs.length} programas</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedBundle(isExpanded ? null : bundle.code)}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      Ver programas
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button
                      onClick={() => handleAssign(bundle.code, bundle.programs)}
                      disabled={isAssigned}
                      className={cn(
                        'flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors',
                        isAssigned
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      )}
                    >
                      {isAssigned ? (
                        <><CheckCircle size={14} /> Asignado</>
                      ) : (
                        <><Zap size={14} /> Asignar Bundle</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Program pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {bundle.programs.map(code => (
                    <span key={code} className={cn(
                      'text-[11px] px-2 py-0.5 rounded-full border font-medium',
                      PROGRAM_TYPE_COLORS[code.split('-')[0]]
                    )}>
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expanded program detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="text-xs font-semibold text-slate-600 mb-3">Programas incluidos en {bundle.code}</h4>
                  <div className="space-y-2">
                    {bundlePrograms.map(prog => {
                      const isProgActive = patient?.assignedPrograms.includes(prog.code) ?? false
                      return (
                        <div key={prog.code} className={cn(
                          'flex items-center justify-between bg-white rounded-lg p-3 border',
                          isProgActive ? 'border-green-200' : 'border-slate-100'
                        )}>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded-full border',
                              PROGRAM_TYPE_COLORS[prog.type]
                            )}>
                              {prog.type}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-700">{prog.code} – {prog.name}</p>
                              <p className="text-xs text-slate-400">{prog.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {prog.sessions && (
                              <span className="text-xs text-slate-400">{prog.sessions} sesiones</span>
                            )}
                            {prog.duration && (
                              <span className="text-xs text-slate-400">· {prog.duration}</span>
                            )}
                            {isProgActive && (
                              <CheckCircle size={14} className="text-green-500" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Patient summary */}
      {patient && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Resumen de Bundles del Paciente
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-2">Bundles asignados ({patient.assignedBundles.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {patient.assignedBundles.length > 0 ? (
                  patient.assignedBundles.map(code => {
                    const bundle = BUNDLES.find(b => b.code === code)
                    return (
                      <span key={code} className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg font-medium">
                        {code} {bundle ? `– ${bundle.name}` : ''}
                      </span>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400">Sin bundles asignados</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Programas activos ({patient.assignedPrograms.length})</p>
              <div className="flex flex-wrap gap-1">
                {patient.assignedPrograms.map(code => (
                  <span key={code} className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full border font-medium',
                    PROGRAM_TYPE_COLORS[code.split('-')[0]]
                  )}>
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
