import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface EncounterRow {
  id: string
  patient_id: string
  staff_id: string | null
  staff_name: string | null
  encounter_type: 'initial' | 'successive' | 'phase_transition' | 'emergency'
  phase_at_encounter: string
  duration_minutes: number
  subjective: any
  objective: any
  assessment: any
  plan: any
  triggers_phase_transition: boolean
  new_phase: string | null
  status: 'in_progress' | 'completed' | 'cancelled'
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function useEncounters(patientId: string | null) {
  return useQuery({
    queryKey: ['encounters', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as EncounterRow[]
    },
  })
}

export function useCreateEncounter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (encounter: Partial<EncounterRow> & { patient_id: string }) => {
      const { data, error } = await supabase
        .from('encounters')
        .insert(encounter as any)
        .select()
        .single()
      if (error) throw error
      return data as unknown as EncounterRow
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['encounters', data.patient_id] })
    },
  })
}

export function useUpdateEncounter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<EncounterRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('encounters')
        .update(fields as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as EncounterRow
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['encounters', data.patient_id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id] })
      qc.invalidateQueries({ queryKey: ['clinical_tests', data.patient_id] })
    },
  })
}
