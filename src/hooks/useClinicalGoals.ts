import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ClinicalGoal {
  id: string
  patient_id: string
  created_by: string
  title: string
  description: string | null
  metric_type: string | null
  target_value: number | null
  target_unit: string | null
  current_value: number | null
  baseline_value: number | null
  deadline: string | null
  status: string
  priority: string
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export function useClinicalGoals(patientId: string | null) {
  return useQuery({
    queryKey: ['clinical_goals', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_goals')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ClinicalGoal[]
    },
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (goal: {
      patient_id: string
      created_by: string
      title: string
      description?: string
      metric_type?: string
      target_value?: number
      target_unit?: string
      current_value?: number
      baseline_value?: number
      deadline?: string
      priority?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('clinical_goals')
        .insert(goal)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clinical_goals', data.patient_id] })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<ClinicalGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('clinical_goals')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clinical_goals', data.patient_id] })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patientId }: { id: string; patientId: string }) => {
      const { error } = await supabase.from('clinical_goals').delete().eq('id', id)
      if (error) throw error
      return patientId
    },
    onSuccess: (patientId) => {
      qc.invalidateQueries({ queryKey: ['clinical_goals', patientId] })
    },
  })
}
