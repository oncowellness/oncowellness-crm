import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
          queryClient.invalidateQueries({ queryKey: ['patients'] })
          const alert = payload.new as any
          const severity = alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : '🟡'
          toast.warning(`${severity} Nueva alerta: ${alert.message ?? alert.alert_type}`, {
            duration: 8000,
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crisis_orders' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['crisis-orders'] })
          const crisis = payload.new as any
          toast.error(`🚨 Orden de crisis: ${crisis.trigger_reason}`, {
            duration: 10000,
          })
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
  }, [queryClient])
}
