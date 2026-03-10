import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

type AppRole = Database['public']['Enums']['app_role']
type Profile = Database['public']['Tables']['profiles']['Row']

export type MfaStatus = 'not_required' | 'needs_enroll' | 'needs_verify' | 'verified'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: AppRole[]
  loading: boolean
  hasRole: (role: AppRole) => boolean
  isAdmin: boolean
  mfaStatus: MfaStatus
  setMfaVerified: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MFA_REQUIRED_ROLES: AppRole[] = ['admin', 'director']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [loading, setLoading] = useState(true)
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>('not_required')

  async function fetchUserData(userId: string) {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ])
    if (profileRes.data) setProfile(profileRes.data)
    const userRoles = rolesRes.data?.map(r => r.role) ?? []
    setRoles(userRoles)
    return userRoles
  }

  async function checkMfaStatus(userRoles: AppRole[]) {
    const requiresMfa = userRoles.some(r => MFA_REQUIRED_ROLES.includes(r))
    if (!requiresMfa) {
      setMfaStatus('not_required')
      return
    }

    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        setMfaStatus('needs_enroll')
        return
      }

      const verifiedTotps = data.totp.filter(f => f.status === 'verified')
      if (verifiedTotps.length === 0) {
        setMfaStatus('needs_enroll')
        return
      }

      // Has enrolled factor — check if current session has AAL2
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.currentLevel === 'aal2') {
        setMfaStatus('verified')
      } else {
        setMfaStatus('needs_verify')
      }
    } catch {
      setMfaStatus('needs_enroll')
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          setTimeout(async () => {
            const userRoles = await fetchUserData(newSession.user.id)
            await checkMfaStatus(userRoles)
          }, 0)
        } else {
          setProfile(null)
          setRoles([])
          setMfaStatus('not_required')
        }
        setLoading(false)
      }
    )

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession)
      setUser(existingSession?.user ?? null)
      if (existingSession?.user) {
        const userRoles = await fetchUserData(existingSession.user.id)
        await checkMfaStatus(userRoles)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasRole = (role: AppRole) => roles.includes(role)
  const isAdmin = hasRole('admin') || hasRole('director')

  const setMfaVerified = useCallback(() => {
    setMfaStatus('verified')
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
    setMfaStatus('not_required')
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, hasRole, isAdmin, mfaStatus, setMfaVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
