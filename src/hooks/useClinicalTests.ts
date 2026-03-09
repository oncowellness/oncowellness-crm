import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ClinicalTestRow = Database['public']['Tables']['clinical_tests']['Row']
type ClinicalTestInsert = Database['public']['Tables']['clinical_tests']['Insert']

export function useClinicalTests(patientId: string | null) {
  return useQuery({
    queryKey: ['clinical_tests', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_tests')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as ClinicalTestRow[]
    },
  })
}

export function useCreateClinicalTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (test: ClinicalTestInsert) => {
      const { data, error } = await supabase.from('clinical_tests').insert(test).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clinical_tests', data.patient_id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id] })
    },
  })
}
