import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heart, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { validatePassword } from '@/lib/passwordPolicy'
import { getPasswordStrength } from '@/lib/passwordStrength'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SetupAccount() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { toast } = useToast()

  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validation = validatePassword(password)
  const strength = getPasswordStrength(password)

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación inválido.')
      setLoading(false)
      return
    }
    verifyToken()
  }, [token])

  async function verifyToken() {
    try {
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (fetchError || !data) {
        setError('Esta invitación no es válida o ya fue utilizada.')
        setLoading(false)
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Esta invitación ha expirado. Contacta a tu administrador.')
        setLoading(false)
        return
      }

      setInvitation(data)
    } catch {
      setError('Error al verificar la invitación.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!validation.isValid || !invitation) return

    setSubmitting(true)
    try {
      // Create the user account via Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: { full_name: invitation.email.split('@')[0] },
          emailRedirectTo: window.location.origin,
        },
      })

      if (signUpError) throw signUpError

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      // Assign the role from the invitation
      if (authData.user) {
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: invitation.role,
        })

        // Log the invitation acceptance in audit
        await supabase.from('audit_logs').insert({
          user_id: authData.user.id,
          action_type: 'invitation_accepted',
          resource_type: 'invitation',
          resource_id: invitation.id,
          user_email: invitation.email,
          metadata: { invited_by: invitation.invited_by, role: invitation.role },
        })
      }

      toast({
        title: 'Cuenta configurada',
        description: 'Tu cuenta ha sido creada exitosamente. Revisa tu correo para confirmar.',
      })

      // Redirect to login after short delay
      setTimeout(() => navigate('/'), 2000)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo crear la cuenta.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Acceso denegado</h2>
            <p className="text-sm text-slate-500">{error}</p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="mt-6"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bienvenido a Oncowellness</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configura tus credenciales seguras para acceder al entorno clínico.
          </p>
          {invitation && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <Heart size={12} />
              <span className="capitalize">{invitation.role.replace('_', ' ')}</span>
              <span className="text-teal-400">·</span>
              <span>{invitation.email}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSetup} className="space-y-5">
            {/* Single password field with show/hide */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Contraseña maestra
              </Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 14 caracteres"
                  required
                  className="pl-10 pr-10 border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Real-time strength meter */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Fortaleza</span>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Policy checks */}
            {password && (
              <div className="space-y-1.5 bg-slate-50 rounded-lg p-3">
                {validation.checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-slate-300 shrink-0" />
                    )}
                    <span className={`text-xs ${check.passed ? 'text-slate-700' : 'text-slate-400'}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !validation.isValid}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              {submitting ? 'Configurando...' : 'Activar cuenta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400 leading-relaxed">
            Tus datos están protegidos con cifrado AES-256. 
            Al activar tu cuenta, aceptas las políticas de seguridad clínica.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
