import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ContentItemRow = Database['public']['Tables']['content_items']['Row']
type ContentItemInsert = Database['public']['Tables']['content_items']['Insert']
type ContentItemUpdate = Database['public']['Tables']['content_items']['Update']

export function useContentItems() {
  return useQuery({
    queryKey: ['content_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data as ContentItemRow[]
    },
  })
}

export function useCreateContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: ContentItemInsert) => {
      const { data, error } = await supabase.from('content_items').insert(item).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_items'] }),
  })
}

export function useUpdateContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: ContentItemUpdate & { id: string }) => {
      const { data, error } = await supabase.from('content_items').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_items'] }),
  })
}

export function useDeleteContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content_items'] }),
  })
}
