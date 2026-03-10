import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Copy, Check, Clock, CheckCircle2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@/integrations/supabase/types'

type AppRole = Database['public']['Enums']['app_role']

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'psiconcologo', label: 'Psico-oncólogo' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'entrenador', label: 'Entrenador' },
  { value: 'admin', label: 'Administrador' },
  { value: 'director', label: 'Director Clínico' },
]

export function InviteUserPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AppRole>('fisioterapeuta')
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSending(true)

    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action_type: 'invitation_sent',
        resource_type: 'invitation',
        resource_id: data.id,
        user_email: user.email,
        metadata: { invited_email: email, role },
      })

      // Try to send the invitation email automatically
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-invitation-email',
          {
            body: {
              email,
              token: data.token,
              role,
              inviterName: user.email,
            },
          }
        )

        if (emailError) throw emailError

        if (emailResult?.method === 'email_sent') {
          toast({
            title: 'Invitación enviada',
            description: `Se envió un email de invitación a ${email}`,
          })
        } else {
          toast({
            title: 'Invitación creada',
            description: emailResult?.message || `Comparte el enlace manualmente con ${email}`,
          })
        }
      } catch (emailErr) {
        // Email sending failed but invitation was created - show link to copy
        console.warn('Email send failed, link available to copy:', emailErr)
        toast({
          title: 'Invitación creada (sin email)',
          description: `No se pudo enviar el email. Copia el enlace y compártelo con ${email}`,
        })
      }

      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo crear la invitación',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  function getSetupLink(token: string) {
    return `${window.location.origin}/setup?token=${token}`
  }

  async function copyLink(token: string, id: string) {
    await navigator.clipboard.writeText(getSetupLink(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: 'Enlace copiado al portapapeles' })
  }

  async function deleteInvitation(id: string) {
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast({ title: 'Invitación eliminada' })
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus size={20} />
            Invitar profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email" className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="profesional@clinica.com"
                  required
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48 space-y-1">
              <Label className="text-xs text-muted-foreground">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? 'Enviando...' : 'Generar invitación'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invitations list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invitaciones enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay invitaciones.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => {
                const expired = isExpired(inv.expires_at)
                const accepted = !!inv.accepted_at
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {inv.role}
                        </Badge>
                        {accepted ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle2 size={10} /> Aceptada
                          </span>
                        ) : expired ? (
                          <span className="flex items-center gap-1 text-[10px] text-destructive">
                            <Clock size={10} /> Expirada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} /> Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    {!accepted && !expired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(inv.token, inv.id)}
                        className="shrink-0"
                      >
                        {copiedId === inv.id ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    )}
                    {!accepted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvitation(inv.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
