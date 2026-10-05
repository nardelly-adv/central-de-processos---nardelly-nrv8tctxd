import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAPEIS = [
  'atendimento',
  'cadastro',
  'operacao_documental',
  'triagem_juridica',
  'advogado_responsavel',
  'supervisao',
  'administracao',
]

const AdminUsuarios = () => {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [novo, setNovo] = useState({ email: '', nome: '', papel: 'atendimento', senha: '' })
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const me = await pb.collection('users').authRefresh()
      if (me.record.papel !== 'administracao' || me.record.ativo !== true) {
        pb.authStore.clear()
        navigate('/entrar', { replace: true })
        return
      }
      const res = await pb.collection('users').getList(1, 50, { sort: 'email' })
      setUsuarios(res.items)
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
        pb.authStore.clear()
        navigate('/entrar', { replace: true })
      } else {
        setErro(e?.response?.message || 'Falha ao carregar usuários.')
      }
    } finally {
      setCarregando(false)
    }
  }, [navigate])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const criar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setErro('')
    setMsg('')
    try {
      await pb.collection('users').create({
        email: novo.email,
        name: novo.nome,
        papel: novo.papel,
        ativo: true,
        password: novo.senha,
        passwordConfirm: novo.senha,
      })
      setNovo({ email: '', nome: '', papel: 'atendimento', senha: '' })
      setMsg('Usuário criado e vinculado ao papel.')
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.message || 'Falha ao criar usuário.')
    }
  }

  const alternarAtivo = async (u: any) => {
    setErro('')
    setMsg('')
    if (u.id === pb.authStore.record?.id && u.ativo) {
      setErro('Não é permitido revogar sua própria conta. Entre com outra sessão de administração.')
      return
    }
    try {
      await pb.collection('users').update(u.id, { ativo: !u.ativo })
      setMsg(
        u.ativo ? 'Usuário revogado; sessões existentes foram invalidadas.' : 'Usuário reativado.',
      )
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.message || 'Falha ao atualizar usuário.')
    }
  }

  const sair = () => {
    pb.authStore.clear()
    window.location.assign('/entrar')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Administração — Usuários e papéis</h1>
            <p className="text-sm text-muted-foreground">
              Acesso administrativo protegido e validado pelo servidor.
            </p>
          </div>
          <Button variant="outline" onClick={sair}>
            Sair desta aba
          </Button>
        </div>
        {erro && (
          <p role="alert" className="text-sm text-red-700">
            {erro}
          </p>
        )}
        {msg && (
          <p role="status" className="text-sm text-green-700">
            {msg}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipe ({usuarios.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <p role="status">Carregando contas…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.papel}</TableCell>
                        <TableCell>{u.ativo ? 'Ativo' : 'Revogado'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={u.id === pb.authStore.record?.id && u.ativo}
                            onClick={() => alternarAtivo(u)}
                          >
                            {u.ativo ? 'Revogar' : 'Reativar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criar usuário sintético</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={criar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="novo-nome">Nome</Label>
                <Input
                  id="novo-nome"
                  required
                  value={novo.nome}
                  onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-email">E-mail</Label>
                <Input
                  id="novo-email"
                  type="email"
                  required
                  value={novo.email}
                  onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-papel">Papel</Label>
                <select
                  id="novo-papel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={novo.papel}
                  onChange={(e) => setNovo({ ...novo, papel: e.target.value })}
                >
                  {PAPEIS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-senha">Senha inicial</Label>
                <Input
                  id="novo-senha"
                  type="password"
                  required
                  minLength={8}
                  value={novo.senha}
                  onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
                />
              </div>
              <Button type="submit" className="md:col-span-4">
                Criar usuário
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminUsuarios
