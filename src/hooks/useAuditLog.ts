import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'login' | 'logout' | 'lockdown_activate' | 'lockdown_deactivate'
type ResourceType = 'patient' | 'clinical_test' | 'session' | 'crisis_order' | 'incentive' | 'system'

interface AuditEntry {
  action_type: AuditAction
  resource_type: ResourceType
  resource_id?: string
  patient_id?: string
  metadata?: Record<string, unknown>
}

export function useAuditLog() {
  const { user, profile } = useAuth()

  const log = useCallback(async (entry: AuditEntry) => {
    if (!user) return

    const { error } = await supabase.from('audit_logs').insert([{
      user_id: user.id,
      user_email: profile?.email ?? user.email ?? null,
      action_type: entry.action_type,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      patient_id: entry.patient_id ?? null,
      metadata: (entry.metadata ?? {}) as any,
    }])
    if (error) {
      // Audit failures must be visible — silent failures break compliance trails
      console.error('[AUDIT LOG FAILURE]', error, entry)
    }
  }, [user, profile])

  return { log }
}
