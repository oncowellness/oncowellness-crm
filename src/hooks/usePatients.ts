import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type PatientRow = Database['public']['Tables']['patients']['Row']
type PatientInsert = Database['public']['Tables']['patients']['Insert']

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PatientRow[]
    },
  })
}

export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ['patient', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as PatientRow
    },
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patient: PatientInsert) => {
      const { data, error } = await supabase.from('patients').insert(patient).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<PatientRow> & { id: string }) => {
      const { data, error } = await supabase.from('patients').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', data.id] })
    },
  })
}
