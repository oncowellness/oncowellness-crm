import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ContentItemRow = Database['public']['Tables']['content_items']['Row']

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
