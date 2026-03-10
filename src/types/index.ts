// ─── Patient Journey Phases ──────────────────────────────────────────────────
export type Phase = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8'

export const PHASE_LABELS: Record<Phase, string> = {
  F1: 'Diagnóstico',
  F2: 'Prehab',
  F3: 'Tratamiento',
  F4: 'Tratamiento Avanzado',
  F5: 'Evaluación',
  F6: 'Supervivencia',
  F7: 'Seguimiento',
  F8: 'Cuidados Avanzados',
}

export const PHASE_COLORS: Record<Phase, string> = {
  F1: 'bg-blue-100 text-blue-700',
  F2: 'bg-cyan-100 text-cyan-700',
  F3: 'bg-orange-100 text-orange-700',
  F4: 'bg-red-100 text-red-700',
  F5: 'bg-purple-100 text-purple-700',
  F6: 'bg-green-100 text-green-700',
  F7: 'bg-teal-100 text-teal-700',
  F8: 'bg-slate-100 text-slate-700',
}

// ─── Role Labels ─────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  director: 'Director',
  fisioterapeuta: 'Fisioterapeuta',
  psiconcologo: 'Psico-oncólogo',
  psicologo: 'Psicólogo',
  nutricionista: 'Nutricionista',
  entrenador: 'Entrenador',
}

// ─── Mind States ─────────────────────────────────────────────────────────────
export type MindState = 'Activo' | 'Ansioso' | 'Depresivo' | 'Resiliente' | 'Vulnerable'

// ─── Alert Status ─────────────────────────────────────────────────────────────
export type AlertStatus = 'verde' | 'amarillo' | 'rojo'

// ─── Program Types ────────────────────────────────────────────────────────────
export type ProgramType = 'FX' | 'PS' | 'NU' | 'EO' | 'TS' | 'TO' | 'SX' | 'PA' | 'ED' | 'PI'

// ─── Session Status ────────────────────────────────────────────────────────────
export type SessionStatus = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada'

// ─── UI State ─────────────────────────────────────────────────────────────────
export type View =
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'physio'
  | 'psycho'
  | 'empowerment'
  | 'clinical-dashboard'
  | 'bundles'
  | 'calendar'
  | 'config-programs'
  | 'config-bundles'
  | 'config-content'
  | 'staff-calendar'
  | 'outcomes'
  | 'incentives'
  | 'security'
  | 'invitations'
  | 'staff-management'
  | 'activity'
  | 'analytics'
  | 'financial'
  | 'goals'
  | 'proms'
