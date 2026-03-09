import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useClinicalEvents(patientId: string | null) {
  return useQuery({
    queryKey: ['clinical_events', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_events')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useLogPhaseTransition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      patient_id: string
      previous_phase: string
      new_phase: string
      reason?: string
      performed_by: string
      performed_by_name: string
    }) => {
      const { error } = await supabase.from('clinical_events').insert([{
        patient_id: params.patient_id,
        event_type: 'phase_transition',
        previous_phase: params.previous_phase as any,
        new_phase: params.new_phase as any,
        reason: params.reason ?? null,
        performed_by: params.performed_by,
        performed_by_name: params.performed_by_name,
      }])
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clinical_events', vars.patient_id] })
    },
  })
}
