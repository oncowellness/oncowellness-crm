import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useEmergencyLock() {
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial state
    supabase
      .from('system_governance')
      .select('emergency_lock_active')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
      .then(({ data }) => {
        setIsLocked(data?.emergency_lock_active ?? false)
        setLoading(false)
      })

    // Subscribe to realtime changes
    const channel = supabase
      .channel('system_governance_lock')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_governance',
        },
        (payload) => {
          setIsLocked(payload.new.emergency_lock_active ?? false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activateLockdown = async (reason: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('system_governance')
      .update({
        emergency_lock_active: true,
        locked_by: user.id,
        locked_at: new Date().toISOString(),
        reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    return !error
  }

  const deactivateLockdown = async () => {
    const { error } = await supabase
      .from('system_governance')
      .update({
        emergency_lock_active: false,
        locked_by: null,
        locked_at: null,
        reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    return !error
  }

  return { isLocked, loading, activateLockdown, deactivateLockdown }
}
