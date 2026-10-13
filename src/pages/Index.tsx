import { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LABELS: Record<string, string> = {
  atendimento: 'Atendimento',
  cadastro: 'Cadastro',
  operacao_documental: 'Operação documental',
  triagem_juridica: 'Triagem jurídica',
  advogado_responsavel: 'Advogado responsável',
  supervisao: 'Supervisão',
  administracao: 'Administração',
}

const PainelPapel = () => {
  const usuario = pb.authStore.record as Record<string, any> | null
  const papel = String(usuario?.papel || '')
  const [prova, setProva] = useState('')
  const [executando, setExecutando] = useState(false)

  const testarNegacao = async () => {
    setProva('')
    setExecutando(true)
    try {
      if (papel === 'atendimento') {
        const casos = await pb.collection('casos').getList(1, 1, { sort: '-created' })
        if (!casos.items.length) throw new Error('Não há caso sintético disponível para a prova.')
        await pb.collection('rotas_triagem').create({
          caso: casos.items[0].id,
          rota: 'triagem_documental',
          observacao: 'Tentativa de prova de permissão da F1-T01',
        })
      } else if (papel === 'cadastro') {
        const pendencias = await pb.collection('pendencias').getFullList({ sort: '-created' })
        const aberta = pendencias.find((p: any) => p.status !== 'resolvida')
        if (!aberta) throw new Error('Não há pendência sintética em aberto para a prova.')
        await pb.collection('pendencias').update(aberta.id, { status: 'resolvida' })
      } else if (papel === 'supervisao') {
        const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        await pb.collection('users').create({
          email: `prova.negada.${nonce}@central.local`,
          name: 'Tentativa sintética de criação não autorizada',
          papel: 'atendimento',
          ativo: true,
          password: `Teste-${nonce}-Segura`,
          passwordConfirm: `Teste-${nonce}-Segura`,
        })
      } else {
        throw new Error(
          'A prova negativa guiada está disponível para atendimento, cadastro e supervisão.',
        )
      }
      setProva(
        'FALHA: o servidor permitiu uma ação que deveria negar. Não continue usando essa sessão; avise a responsável técnica.',
      )
    } catch (e: any) {
      if (e?.status === 403 || e?.response?.status === 403) {
        setProva(
          `PASSOU: o servidor negou a ação (HTTP 403). ${e?.response?.message || e?.message || ''} A tentativa deve constar na trilha de auditoria.`,
        )
      } else {
        setProva(
          `Não foi possível concluir a prova: ${e?.response?.message || e?.message || 'erro inesperado'}`,
        )
      }
    } finally {
      setExecutando(false)
    }
  }

  const permissoes: Record<string, string[]> = {
    atendimento: ['Criar e editar dados iniciais do caso'],
    cadastro: ['Editar cadastro do caso', 'Criar e editar pendências (não validar documentação)'],
    operacao_documental: ['Ler casos', 'Criar, editar e validar pendências documentais'],
    triagem_juridica: ['Ler casos e pendências', 'Definir rota de triagem'],
    advogado_responsavel: ['Ler casos e pendências', 'Consultar trilha de auditoria'],
    supervisao: ['Ler casos e pendências', 'Redistribuir rotas', 'Consultar trilha de auditoria'],
    administracao: ['Gerenciar usuários e papéis', 'Consultar trilha de auditoria'],
  }
  const links = [
    ...(papel === 'administracao' ? [{ to: '/admin/usuarios', label: 'Usuários e papéis' }] : []),
    ...(['supervisao', 'administracao', 'advogado_responsavel'].includes(papel)
      ? [{ to: '/auditoria', label: 'Trilha de auditoria' }]
      : []),
    ...(['atendimento', 'cadastro'].includes(papel)
      ? [{ to: '/intake/nova', label: 'Nova ficha de intake' }]
      : []),
  ]

  const sair = () => {
    pb.authStore.clear()
    window.location.assign('/entrar')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Central de Processos</h1>
            <p className="text-sm text-muted-foreground">
              Perfil autenticado: {LABELS[papel] || papel} · {usuario?.email}
            </p>
          </div>
          <Button variant="outline" onClick={sair}>
            Sair desta aba
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissões deste perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5">
              {(permissoes[papel] || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Outras ações não autorizadas são protegidas também no servidor, não apenas escondidas
              na tela.
            </p>
          </CardContent>
        </Card>

        {links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Áreas autorizadas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {links.map((link) => (
                <Button asChild key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prova de segregação no servidor (CA-1-002)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {papel === 'atendimento' && (
              <p>
                Tentará criar uma rota de triagem, ação reservada à triagem jurídica. Esperado: HTTP
                403 e evento de negação na trilha.
              </p>
            )}
            {papel === 'cadastro' && (
              <p>
                Tentará validar uma pendência documental, ação reservada à operação documental.
                Esperado: HTTP 403 e evento de negação na trilha.
              </p>
            )}
            {papel === 'supervisao' && (
              <p>
                Tentará criar um usuário sintético, ação reservada à administração. Esperado: HTTP
                403 e evento de negação na trilha; nenhum usuário deve ser criado.
              </p>
            )}
            {!['atendimento', 'cadastro', 'supervisao'].includes(papel) && (
              <p>
                Para executar uma prova negativa guiada, saia desta aba e escolha atendimento,
                cadastro ou supervisão na tela de login. Cada aba mantém sessão independente.
              </p>
            )}
            {['atendimento', 'cadastro', 'supervisao'].includes(papel) && (
              <Button onClick={testarNegacao} disabled={executando}>
                {executando ? 'Testando…' : 'Tentar a ação não autorizada'}
              </Button>
            )}
            {prova && (
              <p
                role="status"
                className={
                  prova.startsWith('PASSOU') ? 'text-sm text-green-700' : 'text-sm text-red-700'
                }
              >
                {prova}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Testar outro papel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              Abra outra aba ou saia desta. Selecione outra conta sintética na tela de login; a
              sessão desta aba não será substituída.
            </p>
            <Button asChild variant="outline">
              <Link to="/entrar">Ir para a tela de login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PainelPapel
