import { create } from 'zustand'
import type { Patient, View, PHQ9Assessment, HandgripMeasurement, SixMWTMeasurement } from '../types'
import { MOCK_PATIENTS } from '../data/patients'
import { CONTENT_LIBRARY } from '../data/content'

interface CRMState {
  // Navigation
  view: View
  selectedPatientId: string | null

  // Data
  patients: Patient[]

  // Actions – Navigation
  setView: (view: View) => void
  selectPatient: (id: string | null) => void

  // Actions – Clinical data
  addPHQ9: (patientId: string, assessment: PHQ9Assessment) => void
  addHandgrip: (patientId: string, measurement: HandgripMeasurement) => void
  addSixMWT: (patientId: string, measurement: SixMWTMeasurement) => void

  // Actions – Bundles
  assignBundle: (patientId: string, bundleCode: string, programCodes: string[]) => void

  // Actions – Content
  sendContent: (patientId: string, contentCode: string) => void

  // Actions – Crisis
  acknowledgeCrisis: (patientId: string, crisisId: string) => void

  // Selectors
  getPatient: (id: string) => Patient | undefined
}

function computePHQ9Severity(score: number): PHQ9Assessment['severity'] {
  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (score <= 19) return 'moderately_severe'
  return 'severe'
}

export const useStore = create<CRMState>((set, get) => ({
  view: 'dashboard',
  selectedPatientId: null,
  patients: MOCK_PATIENTS,

  setView: (view) => set({ view }),
  selectPatient: (id) => set({ selectedPatientId: id }),

  getPatient: (id) => get().patients.find(p => p.id === id),

  addPHQ9: (patientId, assessment) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p

        const newPhq9 = [...p.phq9, assessment]
        let alertStatus = p.alertStatus
        let crisisOrders = [...p.crisisOrders]
        let sessions = [...p.sessions]

        // ── RULE: PHQ-9 >= 10 → Alerta Roja + PS-01 crisis order ───────────
        if (assessment.totalScore >= 10) {
          alertStatus = 'rojo'
          const crisisId = `co-${Date.now()}`
          crisisOrders.push({
            id: crisisId,
            date: assessment.date,
            trigger: `PHQ-9 >= 10 (Puntuación: ${assessment.totalScore})`,
            program: 'PS-01',
            status: 'pendiente',
          })
          // Auto-generate crisis session
          sessions.push({
            id: `s-crisis-${Date.now()}`,
            programCode: 'PS-01',
            date: assessment.date,
            status: 'pendiente',
            notes: `Auto-generada por PHQ-9 = ${assessment.totalScore}`,
          })
        } else if (assessment.totalScore >= 5 && alertStatus !== 'rojo') {
          alertStatus = 'amarillo'
        } else if (assessment.totalScore < 5 && alertStatus !== 'rojo') {
          alertStatus = 'verde'
        }

        return { ...p, phq9: newPhq9, alertStatus, crisisOrders, sessions }
      }),
    }))
  },

  addHandgrip: (patientId, measurement) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, handgrip: [...p.handgrip, measurement] } : p
      ),
    }))
  },

  addSixMWT: (patientId, measurement) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, sixMWT: [...p.sixMWT, measurement] } : p
      ),
    }))
  },

  assignBundle: (patientId, bundleCode, programCodes) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const existingBundles = p.assignedBundles.includes(bundleCode)
          ? p.assignedBundles
          : [...p.assignedBundles, bundleCode]
        const existingPrograms = new Set(p.assignedPrograms)
        programCodes.forEach(c => existingPrograms.add(c))
        return { ...p, assignedBundles: existingBundles, assignedPrograms: Array.from(existingPrograms) }
      }),
    }))
  },

  sendContent: (patientId, contentCode) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        const alreadySent = p.contentItems.find(c => c.code === contentCode)
        if (alreadySent) {
          return {
            ...p,
            contentItems: p.contentItems.map(c =>
              c.code === contentCode
                ? { ...c, enabled: true, sentDate: new Date().toISOString().split('T')[0] }
                : c
            ),
          }
        }
        const item = CONTENT_LIBRARY.find(c => c.code === contentCode)
        if (!item) return p
        return {
          ...p,
          contentItems: [
            ...p.contentItems,
            { ...item, enabled: true, sentDate: new Date().toISOString().split('T')[0] },
          ],
        }
      }),
    }))
  },

  acknowledgeCrisis: (patientId, crisisId) => {
    set(state => ({
      patients: state.patients.map(p => {
        if (p.id !== patientId) return p
        return {
          ...p,
          crisisOrders: p.crisisOrders.map(c =>
            c.id === crisisId ? { ...c, status: 'atendida' as const } : c
          ),
        }
      }),
    }))
  },
}))

// Helper to compute PHQ-9 severity (exported for component use)
export { computePHQ9Severity }
