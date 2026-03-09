import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type BundleRow = Database['public']['Tables']['bundles']['Row']
type BundleInsert = Database['public']['Tables']['bundles']['Insert']

export function useBundles() {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data as BundleRow[]
    },
  })
}

export function useCreateBundle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (bundle: BundleInsert) => {
      const { data, error } = await supabase.from('bundles').insert(bundle).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  })
}

export function useUpdateBundle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<BundleRow> & { id: string }) => {
      const { data, error } = await supabase.from('bundles').update(fields).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bundles'] }),
  })
}
