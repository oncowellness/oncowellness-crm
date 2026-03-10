import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useNotificationStore } from '@/store/useNotificationStore'

async function resolvePatientName(patientId: string): Promise<string> {
  const { data } = await supabase
    .from('patients')
    .select('nombre')
    .eq('id', patientId)
    .single()
  return data?.nombre ?? 'Paciente'
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
          queryClient.invalidateQueries({ queryKey: ['patients'] })
          const alert = payload.new as any
          const patientName = await resolvePatientName(alert.patient_id)
          const severity = alert.severity as 'low' | 'medium' | 'high' | 'critical'
          const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡'
          const message = `${alert.message ?? alert.alert_type}`

          addNotification({
            id: alert.id,
            type: 'alert',
            severity,
            message,
            patientName,
            patientId: alert.patient_id,
            timestamp: alert.created_at,
            read: false,
          })

          toast.warning(`${icon} ${patientName}: ${message}`, { duration: 8000 })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crisis_orders' },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ['crisis-orders'] })
          const crisis = payload.new as any
          const patientName = await resolvePatientName(crisis.patient_id)

          addNotification({
            id: crisis.id,
            type: 'crisis',
            severity: 'critical',
            message: crisis.trigger_reason,
            patientName,
            patientId: crisis.patient_id,
            timestamp: crisis.created_at,
            read: false,
          })

          toast.error(`🚨 ${patientName}: ${crisis.trigger_reason}`, { duration: 10000 })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clinical_tests' },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ['clinical_tests'] })
          queryClient.invalidateQueries({ queryKey: ['clinical_tests_all'] })
          const test = payload.new as any
          const patientName = await resolvePatientName(test.patient_id)

          addNotification({
            id: test.id,
            type: 'test',
            severity: 'low',
            message: `Nuevo test ${test.tipo} registrado (valor: ${test.valor_numerico ?? 'N/A'})`,
            patientName,
            patientId: test.patient_id,
            timestamp: test.created_at,
            read: false,
          })

          toast.info(`📊 ${patientName}: Nuevo ${test.tipo} registrado`, { duration: 5000 })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
          const session = payload.new as any
          if (session.status === 'realizada') {
            toast.success(`✅ Sesión ${session.programa_code} completada`)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, addNotification])
}
