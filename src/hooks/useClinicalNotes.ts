import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type NoteInsert = Database['public']['Tables']['clinical_notes']['Insert']
type NoteUpdate = Database['public']['Tables']['clinical_notes']['Update']

export function useCreateClinicalNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (note: NoteInsert) => {
      const { data, error } = await supabase.from('clinical_notes').insert(note).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinical_notes', data.patient_id] })
    },
  })
}

export function useUpdateClinicalNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...update }: NoteUpdate & { id: string }) => {
      const { data, error } = await supabase.from('clinical_notes').update(update).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinical_notes', data.patient_id] })
    },
  })
}

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
