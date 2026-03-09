import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useClinicalNotes(patientId: string | null) {
  return useQuery({
    queryKey: ['clinical_notes', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
