import { supabase } from '@/integrations/supabase/client'
import { addDays, differenceInMinutes, isBefore } from 'date-fns'

// Types based on the new schema
export type AppointmentType = 'initial' | 'follow_up' | 'acute' | 'triage'
export type TriageLevel = 'red' | 'amber' | 'green'

interface AppointmentRequest {
  patientId: string
  staffId: string
  startTime: Date
  endTime: Date
  type: AppointmentType
}

// ─── 1. Scheduling Validation Service ─────────────────────────────────────────

export const validateAppointmentSlot = (req: AppointmentRequest): { valid: boolean; error?: string } => {
  const duration = differenceInMinutes(req.endTime, req.startTime)

  // Rule: New Patient (Initial) -> Mandatory 90 mins
  if (req.type === 'initial' && duration !== 90) {
    return { valid: false, error: 'Las citas iniciales (New Patient) deben durar exactamente 90 minutos.' }
  }

  // Rule: Follow-up -> Mandatory 60 mins
  if (req.type === 'follow_up' && duration !== 60) {
    return { valid: false, error: 'Las citas de seguimiento deben durar exactamente 60 minutos.' }
  }

  // Basic sanity checks
  if (isBefore(req.endTime, req.startTime)) {
    return { valid: false, error: 'La hora de fin no puede ser anterior a la de inicio.' }
  }

  return { valid: true }
}

// ─── 2. Triage Logic ──────────────────────────────────────────────────────────

export const getTriageDeadline = (level: TriageLevel): Date => {
  const today = new Date()
  switch (level) {
    case 'red': return addDays(today, 7)    // Current week
    case 'amber': return addDays(today, 14) // 2 weeks
    case 'green': return addDays(today, 28) // 3-4 weeks
    default: return addDays(today, 30)
  }
}

// ─── 3. Alert Engine (PROs Monitoring) ────────────────────────────────────────

interface ProSubmission {
  patientId: string
  testType: string
  score: number
  answers: number[]
}

/**
 * Evaluates a PRO submission against clinical thresholds.
 * If threshold exceeded, creates a system alert.
 */
export const evaluateProScore = async (submission: ProSubmission) => {
  const { patientId, testType, score } = submission
  let alertSeverity: 'low' | 'medium' | 'high' | 'critical' | null = null
  let alertMessage = ''

  // Clinical Thresholds
  if (testType === 'EVA' || testType === 'BPI') {
    // Pain Scales
    if (score >= 7) {
      alertSeverity = 'high'
      alertMessage = `Alerta de Dolor: Paciente reporta nivel ${score}/10 (Umbral > 7)`
    }
  } else if (testType === 'PHQ-9') {
    // Depression Scale — threshold ≥10 (moderate), consistent with promsDefinitions.ts redFlagThreshold
    if (score >= 10) {
      alertSeverity = 'high'
      alertMessage = `Alerta Psico-Oncología: PHQ-9 score ${score} indica depresión moderada o superior`
    }
  }

  if (alertSeverity) {
    const { error } = await supabase.from('alerts').insert({
      patient_id: patientId,
      alert_type: 'clinical_decline',
      severity: alertSeverity,
      message: alertMessage,
      source_metric: testType,
      source_value: score
    })

    if (error) console.error('Failed to create clinical alert:', error)
  }
}