import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ShieldCheck, Loader, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MfaEnrollProps {
  onComplete: () => void
}

export function MfaEnroll({ onComplete }: MfaEnrollProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [factorId, setFactorId] = useState<string>('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    enrollFactor()
  }, [])

  async function enrollFactor() {
    setLoading(true)
    setError('')
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Oncowellness TOTP',
      })
      if (enrollError) throw enrollError
      if (data) {
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setFactorId(data.id)
      }
    } catch (err: any) {
      setError(err.message || 'Error al configurar MFA')
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndActivate() {
    if (code.length !== 6) {
      setError('Introduce el código de 6 dígitos')
      return
    }
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

      toast({
        title: 'MFA activado',
        description: 'La autenticación de dos factores ha sido configurada correctamente.',
      })
      onComplete()
    } catch (err: any) {
      setError(err.message || 'Código incorrecto. Inténtalo de nuevo.')
    } finally {
      setVerifying(false)
    }
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
          <h1 className="text-xl font-bold text-slate-900">Configurar Autenticación MFA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tu rol requiere autenticación de dos factores (TOTP)
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader size={24} className="animate-spin text-teal-600" />
              <p className="text-sm text-slate-500">Generando código QR...</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  1. Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code MFA" className="w-48 h-48 rounded-lg border border-slate-200" />
                  </div>
                )}
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer hover:text-slate-600">¿No puedes escanear? Clave manual</summary>
                  <code className="block mt-2 p-2 bg-slate-100 rounded text-[10px] font-mono break-all select-all">{secret}</code>
                </details>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  2. Introduce el código de 6 dígitos de tu app
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <Button
                onClick={verifyAndActivate}
                disabled={verifying || code.length !== 6}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium"
              >
                {verifying ? 'Verificando...' : 'Activar MFA'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
