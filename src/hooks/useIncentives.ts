import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type IncentiveRow = Database['public']['Tables']['incentives']['Row']

export function useIncentives(staffId?: string) {
  return useQuery({
    queryKey: ['incentives', staffId],
    queryFn: async () => {
      let query = supabase.from('incentives').select('*').order('created_at', { ascending: false })
      if (staffId) query = query.eq('staff_id', staffId)
      const { data, error } = await query
      if (error) throw error
      return data as IncentiveRow[]
    },
  })
}

export function useIncentivesSummary(month?: string) {
  return useQuery({
    queryKey: ['incentives-summary', month],
    queryFn: async () => {
      let query = supabase.from('incentives').select('*')
      if (month) {
        query = query.eq('mes_liquidacion', month)
      }
      const { data, error } = await query
      if (error) throw error

      // Group by staff
      const byStaff: Record<string, { fijo: number; hito_clinico: number; video_rrss: number; bono_extra: number; total: number; items: IncentiveRow[] }> = {}
      for (const item of (data as IncentiveRow[])) {
        if (!byStaff[item.staff_id]) {
          byStaff[item.staff_id] = { fijo: 0, hito_clinico: 0, video_rrss: 0, bono_extra: 0, total: 0, items: [] }
        }
        const entry = byStaff[item.staff_id]
        entry[item.concepto] = (entry[item.concepto] || 0) + Number(item.monto)
        entry.total += Number(item.monto)
        entry.items.push(item)
      }
      return byStaff
    },
  })
}

export function useApproveIncentive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('incentives')
        .update({ estado: 'aprobado' })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incentives'] }),
  })
}
