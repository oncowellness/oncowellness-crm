import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error('Credenciales inválidas. Inténtalo de nuevo.')
    } catch (err: any) {
      toast({
        title: 'Error de autenticación',
        description: 'Las credenciales proporcionadas no son válidas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Heart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Oncowellness</h1>
          <p className="text-sm text-slate-500 mt-1">
            CRM Clínico · Modelo MSK
          </p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
            Cuidar a quienes cuidan. Cada dato, cada sesión, cada paso importa.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Correo electrónico</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="pl-10 border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 border-slate-200 focus:border-teal-400 focus:ring-teal-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium shadow-md shadow-teal-500/20"
            >
              {loading ? 'Procesando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Acceso exclusivo por invitación. Contacta a tu administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
