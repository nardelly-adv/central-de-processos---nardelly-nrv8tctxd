import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, AreaBadge } from '@/components/StatusBadges'
import {
  formatarCNJ,
  formatarCPFouCNPJ,
  formatarData,
  formatarMoeda,
  formatarTelefone,
} from '@/lib/formatadores'
import { obterCliente, excluirCliente } from '@/services/clientes'
import { listarProcessos } from '@/services/processos'
import { listarDocumentos, obterUrlArquivo } from '@/services/documentos'
import type { Cliente, Processo, Documento } from '@/types/juridico'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const ClienteDetalhe = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [processos, setProcessos] = useState<Processo[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState(false)
  const [dialogExclusao, setDialogExclusao] = useState(false)

  useEffect(() => {
    async function carregar() {
      if (!id) return
      setCarregando(true)
      try {
        const [cli, procs, docs] = await Promise.all([
          obterCliente(id),
          listarProcessos({ clienteId: id }),
          listarDocumentos({ clienteId: id }),
        ])
        setCliente(cli)
        setProcessos(procs)
        setDocumentos(docs)
      } catch (err) {
        toast({
          title: 'Cliente não encontrado',
          description: 'Não foi possível carregar os dados deste cliente.',
          variant: 'destructive',
        })
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id])

  const deletarCliente = async () => {
    if (!id) return
    setExcluindo(true)
    try {
      await excluirCliente(id)
      toast({
        title: 'Cliente excluído',
        description: 'Registro removido com sucesso.',
      })
      navigate('/clientes')
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cliente. Verifique pendências ou processos.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
      setDialogExclusao(false)
    }
  }

  if (carregando) {
    return <div className="p-8 text-center text-slate-500">Carregando informações do cliente…</div>
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Cliente não localizado no sistema.</p>
        <Button asChild variant="outline">
          <Link to="/clientes">Voltar para a lista</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Botão Voltar e Ações do Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link to="/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{cliente.nome}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {cliente.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cadastrado em {formatarData(cliente.created)} · Atualizado em{' '}
              {formatarData(cliente.updated)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-teal-700 hover:bg-teal-800 text-white">
            <Link to={`/processos?novo=1&clienteId=${cliente.id}`}>
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Processo para este Cliente
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setDialogExclusao(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Principal: Dados do Cliente + Processos e Documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Ficha de Contato e Qualificação */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {cliente.tipo_pessoa === 'juridica' ? (
                  <Building2 className="h-5 w-5 text-teal-700" />
                ) : (
                  <UserCheck className="h-5 w-5 text-teal-700" />
                )}
                Qualificação e Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase">
                  {cliente.tipo_pessoa === 'juridica' ? 'CNPJ' : 'CPF'}
                </p>
                <p className="font-mono text-slate-800">{formatarCPFouCNPJ(cliente.cpf_cnpj)}</p>
              </div>

              {cliente.rg && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">RG</p>
                  <p className="font-mono text-slate-800">{cliente.rg}</p>
                </div>
              )}

              {cliente.email && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">E-mail</p>
                  <a
                    href={`mailto:${cliente.email}`}
                    className="text-teal-700 hover:underline flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {cliente.email}
                  </a>
                </div>
              )}

              {(cliente.telefone || cliente.whatsapp) && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">
                    Telefone / WhatsApp
                  </p>
                  <a
                    href={`https://wa.me/55${(cliente.whatsapp || cliente.telefone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {formatarTelefone(cliente.whatsapp || cliente.telefone)}
                  </a>
                </div>
              )}

              {cliente.profissao && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">Profissão</p>
                  <p className="text-slate-800">{cliente.profissao}</p>
                </div>
              )}

              {cliente.estado_civil && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">Estado Civil</p>
                  <p className="text-slate-800 capitalize">
                    {cliente.estado_civil.replace('_', ' ')}
                  </p>
                </div>
              )}

              {(cliente.endereco || cliente.cidade) && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase">Endereço</p>
                  <p className="text-slate-800 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {cliente.endereco}
                      {cliente.cidade ? ` — ${cliente.cidade}` : ''}
                      {cliente.estado ? `/${cliente.estado}` : ''}
                      {cliente.cep ? ` (${cliente.cep})` : ''}
                    </span>
                  </p>
                </div>
              )}

              {cliente.observacoes && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase">Anotações Internas</p>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-md text-xs whitespace-pre-wrap">
                    {cliente.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel Direito: Processos e Documentos Vinculados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Processos do Cliente */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal-700" />
                  Processos Vinculados ({processos.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Ações judiciais e administrativas sob responsabilidade do escritório
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link to={`/processos?novo=1&clienteId=${cliente.id}`}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Novo Processo
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {processos.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Este cliente ainda não possui processos vinculados.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {processos.map((p) => (
                    <Link
                      key={p.id}
                      to={`/processos/${p.id}`}
                      className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50/80 rounded-lg px-2 transition block group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                            {formatarCNJ(p.numero_cnj)}
                          </span>
                          <AreaBadge area={p.area} />
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{p.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {p.vara || p.comarca || 'Comarca não informada'} · Valor:{' '}
                          {formatarMoeda(p.valor_causa)}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-700 shrink-0 mt-2" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos do Cliente */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-700" />
                  Documentos Arquivados ({documentos.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Procurações, comprovantes, petições e certidões deste cliente
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline" className="text-xs">
                <Link to={`/documentos?clienteId=${cliente.id}`}>Biblioteca completa</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Nenhum documento salvo diretamente para este cliente ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documentos.map((doc) => {
                    const url = obterUrlArquivo(doc)
                    return (
                      <div
                        key={doc.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{doc.nome}</p>
                          <p className="text-xs text-slate-400">
                            {doc.categoria || 'Geral'} · {formatarData(doc.created)}
                          </p>
                        </div>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-700 hover:underline flex items-center gap-1 shrink-0"
                          >
                            Abrir anexo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      <AlertDialog open={dialogExclusao} onOpenChange={setDialogExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente remover o cliente <strong>{cliente.nome}</strong>? Processos
              vinculados precisarão ser alterados antes ou arquivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletarCliente}
              disabled={excluindo}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ClienteDetalhe
