import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ShieldCheck, AlertTriangle, LogOut } from 'lucide-react'

interface MfaVerifyProps {
  onVerified: () => void
  onSignOut: () => void
}

export function MfaVerify({ onVerified, onSignOut }: MfaVerifyProps) {
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFactors()
  }, [])

  async function loadFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setError('Error al cargar factores MFA')
      return
    }
    const verifiedTotps = data.totp.filter(f => f.status === 'verified')
    if (verifiedTotps.length > 0) {
      setFactorId(verifiedTotps[0].id)
    }
  }

  async function handleVerify() {
    if (!factorId || code.length !== 6) return
    setVerifying(true)
    setError('')
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      })
      if (verifyError) throw verifyError

      onVerified()
    } catch (err: any) {
      setError('Código incorrecto. Inténtalo de nuevo.')
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && code.length === 6) handleVerify()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verificación MFA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Introduce el código de tu app de autenticación
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] font-mono border-slate-200 focus:border-teal-400 focus:ring-teal-400"
            autoFocus
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium"
          >
            {verifying ? 'Verificando...' : 'Verificar'}
          </Button>

          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 py-2"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
