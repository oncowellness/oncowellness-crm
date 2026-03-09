import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function usePatientAlerts(patientId: string | null) {
  return useQuery({
    queryKey: ['alerts', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
