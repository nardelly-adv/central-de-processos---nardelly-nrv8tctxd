import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const CONTAS_SINTETICAS = [
  { papel: 'Atendimento', email: 'ana.atendimento@central.local' },
  { papel: 'Cadastro', email: 'carlos.cadastro@central.local' },
  { papel: 'Operação documental', email: 'beatriz.documental@central.local' },
  { papel: 'Triagem jurídica', email: 'daniela.triagem@central.local' },
  { papel: 'Advogado responsável', email: 'ricardo.advogado@central.local' },
  { papel: 'Supervisão', email: 'sofia.supervisao@central.local' },
  { papel: 'Administração', email: 'marcio.administracao@central.local' },
]

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await pb.collection('users').authWithPassword(email, senha)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/admin/usuarios' && from !== '/auditoria' ? from : '/', {
        replace: true,
      })
    } catch (e: any) {
      setErro(e?.response?.message || 'Não foi possível entrar. Verifique e-mail e senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Central de Processos — Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conta-sintetica">Selecionar conta sintética de teste</Label>
              <select
                id="conta-sintetica"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              >
                <option value="">Escolha um papel (ou informe outro e-mail abaixo)</option>
                {CONTAS_SINTETICAS.map((conta) => (
                  <option key={conta.email} value={conta.email}>
                    {conta.papel} — {conta.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Contas sintéticas exclusivamente para validar os papéis; selecione a conta e digite
                a senha.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@central.local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            As sessões são isoladas por aba. A revogação de uma conta não transfere outra identidade
            para esta aba.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
