import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type PatientContentRow = Database['public']['Tables']['patient_content']['Row']

export function usePatientContent(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient_content', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_content')
        .select('*, content_items(code, title, tipo)')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSendContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ patientId, contentId }: { patientId: string; contentId: string }) => {
      const { error } = await supabase
        .from('patient_content')
        .insert({
          patient_id: patientId,
          content_id: contentId,
          sent_date: new Date().toISOString().split('T')[0],
          enabled: true,
        })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['patient_content', vars.patientId] })
    },
  })
}
