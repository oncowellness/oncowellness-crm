import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useAllCrisisOrders() {
  return useQuery({
    queryKey: ['crisis_orders_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crisis_orders')
        .select('*, patients(nombre)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
