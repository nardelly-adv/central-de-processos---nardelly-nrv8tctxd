import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Calendar,
  Clock,
  User,
  Building,
  Plus,
  ArrowLeft,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Upload,
  ExternalLink,
  Tag,
  Shield,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge, AreaBadge, PrioridadeBadge } from '@/components/StatusBadges'
import { EmptyState } from '@/components/EmptyState'
import { formatarCNJ, formatarData, formatarMoeda, formatarBytes } from '@/lib/formatadores'
import { obterProcesso, atualizarProcesso } from '@/services/processos'
import {
  listarMovimentacoesProcesso,
  criarMovimentacao,
  alternarCumpridoMovimentacao,
  excluirMovimentacao,
} from '@/services/movimentacoes'
import {
  listarDocumentos,
  criarDocumento,
  excluirDocumento,
  obterUrlArquivo,
} from '@/services/documentos'
import type {
  Processo,
  Movimentacao,
  Documento,
  TipoMovimentacao,
  CategoriaDocumento,
} from '@/types/juridico'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const TIPOS_MOVIMENTACAO: TipoMovimentacao[] = [
  'Peticao',
  'Despacho',
  'Decisao',
  'Sentenca',
  'Audiencia',
  'Acordao',
  'Publicacao',
  'Outro',
]

const CATEGORIAS_DOCUMENTO: CategoriaDocumento[] = [
  'Procuracao',
  'Peticao',
  'Contrato',
  'Identidade',
  'Comprovante',
  'Sentenca_Decisao',
  'Laudo_Pericia',
  'Outro',
]

export const ProcessoDetalhe = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [processo, setProcesso] = useState<Processo | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [carregando, setCarregando] = useState(true)

  // Modal Novo Andamento
  const [modalAndamentoAberto, setModalAndamentoAberto] = useState(false)
  const [salvandoAndamento, setSalvandoAndamento] = useState(false)
  const [movTitulo, setMovTitulo] = useState('')
  const [movTipo, setMovTipo] = useState<TipoMovimentacao>('Peticao')
  const [movData, setMovData] = useState(new Date().toISOString().split('T')[0])
  const [movDescricao, setMovDescricao] = useState('')
  const [movPrazoFatal, setMovPrazoFatal] = useState('')

  // Modal Upload Documento
  const [modalDocAberto, setModalDocAberto] = useState(false)
  const [salvandoDoc, setSalvandoDoc] = useState(false)
  const [docNome, setDocNome] = useState('')
  const [docCategoria, setDocCategoria] = useState<CategoriaDocumento>('Peticao')
  const [docDescricao, setDocDescricao] = useState('')
  const [docArquivo, setDocArquivo] = useState<File | null>(null)

  const carregarTudo = async () => {
    if (!id) return
    setCarregando(true)
    try {
      const [p, movs, docs] = await Promise.all([
        obterProcesso(id),
        listarMovimentacoesProcesso(id),
        listarDocumentos({ processoId: id }),
      ])
      setProcesso(p)
      setMovimentacoes(movs)
      setDocumentos(docs)
    } catch {
      toast({
        title: 'Processo não encontrado',
        description: 'Não foi possível carregar os autos deste processo.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [id])

  // Salvar novo andamento
  const salvarNovoAndamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !movTitulo.trim() || !movData) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Título e data da movimentação são necessários.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoAndamento(true)
    try {
      await criarMovimentacao({
        processo: id,
        titulo: movTitulo.trim(),
        tipo: movTipo,
        data: movData,
        descricao: movDescricao.trim() || undefined,
        prazo_fatal: movPrazoFatal || undefined,
        cumprido: false,
      })

      // Se informou um prazo fatal, opcionalmente atualizar no processo
      if (movPrazoFatal) {
        await atualizarProcesso(id, {
          proximo_prazo: movPrazoFatal,
          descricao_proximo_prazo: movTitulo.trim(),
        })
      }

      toast({
        title: 'Andamento lançado',
        description: 'Movimentação adicionada à timeline dos autos.',
      })
      setModalAndamentoAberto(false)
      setMovTitulo('')
      setMovDescricao('')
      setMovPrazoFatal('')
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro ao lançar andamento',
        description: err?.message || 'Falha ao registrar movimentação.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoAndamento(false)
    }
  }

  // Alternar cumprimento de prazo
  const toggleCumprido = async (mov: Movimentacao) => {
    try {
      const novoStatus = !mov.cumprido
      await alternarCumpridoMovimentacao(mov.id, novoStatus)
      setMovimentacoes((prev) =>
        prev.map((item) => (item.id === mov.id ? { ...item, cumprido: novoStatus } : item)),
      )
      toast({
        title: novoStatus ? 'Prazo cumprido!' : 'Prazo reaberto',
        description: `O andamento "${mov.titulo}" foi atualizado.`,
      })
    } catch {
      toast({
        title: 'Erro ao alterar prazo',
        variant: 'destructive',
      })
    }
  }

  // Excluir andamento
  const removerAndamento = async (movId: string) => {
    try {
      await excluirMovimentacao(movId)
      setMovimentacoes((prev) => prev.filter((m) => m.id !== movId))
      toast({
        title: 'Andamento excluído',
      })
    } catch {
      toast({
        title: 'Erro ao excluir andamento',
        variant: 'destructive',
      })
    }
  }

  // Upload de documento vinculado ao processo
  const salvarUploadDocumento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !docArquivo || !docNome.trim()) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Selecione um arquivo e informe o nome do documento.',
        variant: 'destructive',
      })
      return
    }

    setSalvandoDoc(true)
    const formData = new FormData()
    formData.append('nome', docNome.trim())
    formData.append('categoria', docCategoria)
    formData.append('arquivo', docArquivo)
    formData.append('processo', id)
    if (processo?.cliente) {
      formData.append('cliente', processo.cliente)
    }
    if (docDescricao.trim()) {
      formData.append('descricao', docDescricao.trim())
    }
    formData.append('tamanho_bytes', String(docArquivo.size))

    try {
      await criarDocumento(formData)
      toast({
        title: 'Documento anexado!',
        description: 'Arquivo salvo com sucesso nos autos do processo.',
      })
      setModalDocAberto(false)
      setDocNome('')
      setDocDescricao('')
      setDocArquivo(null)
      carregarTudo()
    } catch (err: any) {
      toast({
        title: 'Erro no upload',
        description: err?.message || 'Não foi possível salvar o anexo.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoDoc(false)
    }
  }

  const removerDocumento = async (docId: string) => {
    try {
      await excluirDocumento(docId)
      setDocumentos((prev) => prev.filter((d) => d.id !== docId))
      toast({
        title: 'Documento removido',
      })
    } catch {
      toast({
        title: 'Erro ao remover documento',
        variant: 'destructive',
      })
    }
  }

  if (carregando) {
    return <div className="p-8 text-center text-slate-500">Carregando autos do processo…</div>
  }

  if (!processo) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Processo não encontrado no sistema.</p>
        <Button asChild variant="outline">
          <Link to="/processos">Voltar para processos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link to="/processos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-bold text-slate-900">
                {formatarCNJ(processo.numero_cnj)}
              </span>
              <AreaBadge area={processo.area} />
              <StatusBadge status={processo.status} />
              <PrioridadeBadge prioridade={processo.prioridade} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
              {processo.titulo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalAndamentoAberto(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Andamento
          </Button>
          <Button
            onClick={() => setModalDocAberto(true)}
            variant="outline"
            className="border-slate-300 text-slate-700"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Anexar Documento
          </Button>
        </div>
      </div>

      {/* Grid Principal: Detalhes dos Autos + Timeline e Anexos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Dados dos Autos (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-teal-700" />
                Dados do Processo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-slate-400 uppercase">Cliente Representado</p>
                {processo.expand?.cliente ? (
                  <Link
                    to={`/clientes/${processo.expand.cliente.id}`}
                    className="font-medium text-teal-700 hover:underline flex items-center gap-1 text-sm"
                  >
                    <User className="h-3.5 w-3.5" />
                    {processo.expand.cliente.nome}
                  </Link>
                ) : (
                  <p className="text-slate-700">Não informado</p>
                )}
              </div>

              {processo.parte_contraria && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Parte Contrária</p>
                  <p className="font-medium text-slate-800 text-sm">{processo.parte_contraria}</p>
                </div>
              )}

              {processo.fase && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Fase Atual</p>
                  <p className="font-medium text-slate-800">{processo.fase}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Tribunal</p>
                  <p className="font-medium text-slate-800">{processo.tribunal || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Comarca</p>
                  <p className="font-medium text-slate-800">{processo.comarca || '—'}</p>
                </div>
              </div>

              {processo.vara && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Vara</p>
                  <p className="font-medium text-slate-800">{processo.vara}</p>
                </div>
              )}

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <p className="font-semibold text-slate-400 uppercase">Valor da Causa</p>
                <p className="text-base font-bold text-emerald-700 font-mono">
                  {formatarMoeda(processo.valor_causa)}
                </p>
              </div>

              {processo.data_distribuicao && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-400 uppercase">Data de Distribuição</p>
                  <p className="font-medium text-slate-700">
                    {formatarData(processo.data_distribuicao)}
                  </p>
                </div>
              )}

              {processo.proximo_prazo && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-amber-700" />
                    Próximo Prazo / Audiência
                  </p>
                  <p className="text-sm font-bold text-amber-950 font-mono">
                    {formatarData(processo.proximo_prazo)}
                  </p>
                  {processo.descricao_proximo_prazo && (
                    <p className="text-xs text-amber-800 leading-snug">
                      {processo.descricao_proximo_prazo}
                    </p>
                  )}
                </div>
              )}

              {processo.observacoes && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-400 uppercase">Anotações Estratégicas</p>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-md text-xs whitespace-pre-wrap leading-relaxed">
                    {processo.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Timeline de Movimentações + Documentos dos Autos (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Timeline de Andamentos */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-700" />
                  Timeline de Movimentações & Andamentos ({movimentacoes.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Histórico cronológico das ocorrências, despachos e petições
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalAndamentoAberto(true)}
                className="text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Lançar
              </Button>
            </CardHeader>
            <CardContent>
              {movimentacoes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Nenhuma movimentação lançada nos autos ainda. Clique em "Novo Andamento" para
                  começar.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-teal-200/80 space-y-6 my-2">
                  {movimentacoes.map((mov) => (
                    <div key={mov.id} className="relative group">
                      {/* Marcador na Timeline */}
                      <div
                        className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${
                          mov.prazo_fatal && !mov.cumprido
                            ? 'bg-amber-500'
                            : mov.tipo === 'Sentenca' || mov.tipo === 'Decisao'
                              ? 'bg-indigo-600'
                              : 'bg-teal-600'
                        }`}
                      />

                      <div className="bg-slate-50/70 hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatarData(mov.data)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-medium">
                              {mov.tipo}
                            </span>
                            {mov.prazo_fatal && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                  mov.cumprido
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900 animate-pulse'
                                }`}
                              >
                                {mov.cumprido
                                  ? '✓ Prazo cumprido'
                                  : `! Prazo fatal: ${formatarData(mov.prazo_fatal)}`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-center">
                            {mov.prazo_fatal && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCumprido(mov)}
                                className={`h-7 px-2 text-xs font-medium ${
                                  mov.cumprido
                                    ? 'text-slate-500 hover:text-slate-700'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                {mov.cumprido ? 'Reabrir' : 'Marcar Cumprido'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerAndamento(mov.id)}
                              className="h-7 w-7 text-slate-400 hover:text-rose-600"
                              title="Excluir andamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900">{mov.titulo}</h4>

                        {mov.descricao && (
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {mov.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos Anexados ao Processo */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-700" />
                  Peças e Documentos dos Autos ({documentos.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Petições, sentenças, laudos periciais e contratos digitalizados
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalDocAberto(true)}
                className="text-xs"
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                Anexar
              </Button>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-sm">
                  Nenhum arquivo ou peça anexada a este processo ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documentos.map((doc) => {
                    const url = obterUrlArquivo(doc)
                    return (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:border-teal-400 hover:shadow-2xs transition flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {doc.categoria || 'Outro'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatarData(doc.created)}
                            </span>
                          </div>
                          <p
                            className="text-sm font-semibold text-slate-900 truncate"
                            title={doc.nome}
                          >
                            {doc.nome}
                          </p>
                          {doc.descricao && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {doc.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-400">{formatarBytes(doc.tamanho_bytes)}</span>
                          <div className="flex items-center gap-2">
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
                              >
                                Baixar / Ver
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              onClick={() => removerDocumento(doc.id)}
                              className="text-slate-400 hover:text-rose-600 transition p-1"
                              title="Remover documento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Lançar Andamento */}
      <Dialog open={modalAndamentoAberto} onOpenChange={setModalAndamentoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lançar Andamento / Movimentação</DialogTitle>
            <DialogDescription>
              Registre o andamento processual, despacho, audiência ou petição.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarNovoAndamento} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="mov_titulo">Título da Movimentação *</Label>
              <Input
                id="mov_titulo"
                required
                placeholder="Ex: Juntada de petição / Decisão interlocutória deferida"
                value={movTitulo}
                onChange={(e) => setMovTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mov_tipo">Tipo</Label>
                <select
                  id="mov_tipo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={movTipo}
                  onChange={(e) => setMovTipo(e.target.value as TipoMovimentacao)}
                >
                  {TIPOS_MOVIMENTACAO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mov_data">Data da Ocorrência *</Label>
                <Input
                  id="mov_data"
                  type="date"
                  required
                  value={movData}
                  onChange={(e) => setMovData(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mov_prazo_fatal">Data do Prazo Fatal / Audiência (Opcional)</Label>
              <Input
                id="mov_prazo_fatal"
                type="date"
                value={movPrazoFatal}
                onChange={(e) => setMovPrazoFatal(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">
                Se informado, este compromisso será adicionado à agenda e ao painel de prazos.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mov_desc">Resumo / Detalhamento</Label>
              <textarea
                id="mov_desc"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Descreva o teor do despacho, publicação ou providências necessárias…"
                value={movDescricao}
                onChange={(e) => setMovDescricao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAndamentoAberto(false)}
                disabled={salvandoAndamento}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white"
                disabled={salvandoAndamento}
              >
                {salvandoAndamento ? 'Salvando…' : 'Registrar Andamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Upload Anexo */}
      <Dialog open={modalDocAberto} onOpenChange={setModalDocAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexar Documento aos Autos</DialogTitle>
            <DialogDescription>
              Envie arquivos em PDF, Word (DOCX) ou imagem relacionados a este processo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarUploadDocumento} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc_arquivo">Arquivo *</Label>
              <Input
                id="doc_arquivo"
                type="file"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setDocArquivo(file)
                    if (!docNome) {
                      setDocNome(file.name.replace(/\.[^/.]+$/, ''))
                    }
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_nome">Nome / Identificação do Documento *</Label>
              <Input
                id="doc_nome"
                required
                placeholder="Ex: Petição Inicial Assinada, Procuração, Sentença"
                value={docNome}
                onChange={(e) => setDocNome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_cat">Categoria</Label>
              <select
                id="doc_cat"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={docCategoria}
                onChange={(e) => setDocCategoria(e.target.value as CategoriaDocumento)}
              >
                {CATEGORIAS_DOCUMENTO.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_desc">Descrição ou Observação (Opcional)</Label>
              <Input
                id="doc_desc"
                placeholder="Ex: Protocolada via ESAJ com comprovante de taxa paga"
                value={docDescricao}
                onChange={(e) => setDocDescricao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalDocAberto(false)}
                disabled={salvandoDoc}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white"
                disabled={salvandoDoc}
              >
                {salvandoDoc ? 'Enviando arquivo…' : 'Anexar Documento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProcessoDetalhe
