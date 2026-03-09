import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ProgramRow = Database['public']['Tables']['programs']['Row']
type ProgramInsert = Database['public']['Tables']['programs']['Insert']

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data as ProgramRow[]
    },
  })
}

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (program: ProgramInsert) => {
      const { data, error } = await supabase.from('programs').insert(program).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })
}

export function useUpdateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<ProgramRow> & { id: string }) => {
      const { data, error } = await supabase.from('programs').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })
}
