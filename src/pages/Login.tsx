import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Scale, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('equipe@central.adv.br')
  const [senha, setSenha] = useState('Central@123')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await pb.collection('users').authWithPassword(email, senha)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from || '/', { replace: true })
    } catch (e: any) {
      setErro(
        e?.response?.message || 'Não foi possível entrar. Verifique seu e-mail e senha de acesso.',
      )
    } finally {
      setCarregando(false)
    }
  }

  const preencherDemo = (demoEmail: string, demoSenha: string) => {
    setEmail(demoEmail)
    setSenha(demoSenha)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Detalhes de iluminação no fundo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-900/50 mb-2">
            <Scale className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Central de Processos</h1>
          <p className="text-sm text-teal-200/80">
            Ambiente exclusivo da equipe jurídica do escritório
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md text-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white font-medium flex items-center justify-between">
              <span>Acessar o Sistema</span>
              <ShieldCheck className="h-5 w-5 text-teal-400" />
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Insira as credenciais da equipe compartilhada para gerenciar processos e clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={entrar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  E-mail institucional
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="equipe@central.adv.br"
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="senha" className="text-xs font-medium text-slate-300">
                    Senha de acesso
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="senha"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              {erro && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-semibold">Erro:</span> {erro}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-md shadow-teal-900/40 transition-all h-10"
                disabled={carregando}
              >
                {carregando ? (
                  'Validando credenciais…'
                ) : (
                  <>
                    Entrar na Central
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Caixa de Demonstração Rápida */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Acesso Rápido de Demonstração</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Utilize o acesso unificado padrão configurado para a equipe do escritório:
              </p>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-mono text-teal-300">equipe@central.adv.br</p>
                  <p className="font-mono text-slate-400 text-[11px]">Senha: Central@123</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => preencherDemo('equipe@central.adv.br', 'Central@123')}
                  className="h-7 text-xs border-teal-700/50 text-teal-300 hover:bg-teal-900/50"
                >
                  Carregar
                </Button>
              </div>
              <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                <div>
                  <p className="text-slate-300">Dr. Ricardo (Advogado)</p>
                  <p className="font-mono text-slate-500 text-[10px]">
                    ricardo.advogado@central.local
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => preencherDemo('ricardo.advogado@central.local', 'Nardelly@2026')}
                  className="h-6 text-[11px] text-slate-400 hover:text-white"
                >
                  Usar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Central de Processos Jurídicos · Advocacia Nardelly · Versão 2.0
        </p>
      </div>
    </div>
  )
}

export default Login
