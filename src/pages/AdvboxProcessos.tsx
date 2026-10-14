import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Calendar,
  User,
  FolderOpen,
  FileText,
  ChevronRight,
  X,
  ExternalLink,
  History,
  Activity,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AdvboxNavHeader } from '@/components/AdvboxNavHeader'
import { AdvboxErrorBanner } from '@/components/AdvboxErrorBanner'
import {
  listarProcessosAdvbox,
  obterProcessoAdvbox,
  listarMovimentacoesAdvbox,
  obterHistoricoProcessoAdvbox,
  listarPublicacoesProcessoAdvbox,
  obterConfiguracoesAdvbox,
  AdvboxSettings,
} from '@/services/advbox'
import { formatarData, formatarMoeda } from '@/lib/formatadores'

export default function AdvboxProcessos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idFromUrl = searchParams.get('id')

  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [processos, setProcessos] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [settings, setSettings] = useState<AdvboxSettings | null>(null)

  // Filtros
  const [buscaTexto, setBuscaTexto] = useState('')
  const [faseFiltro, setFaseFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')

  // Modal de Detalhe do Processo
  const [processoSelecionadoId, setProcessoSelecionadoId] = useState<number | string | null>(
    idFromUrl ? idFromUrl : null,
  )
  const [detalheProcesso, setDetalheProcesso] = useState<any | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)

  // Abas do Detalhe: 'dados' | 'movimentacoes' | 'historico' | 'publicacoes'
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'movimentacoes' | 'historico' | 'publicacoes'>(
    'movimentacoes',
  )
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [publicacoes, setPublicacoes] = useState<any[]>([])
  const [carregandoAba, setCarregandoAba] = useState(false)

  // Carregar configurações de settings para preencher selects
  useEffect(() => {
    obterConfiguracoesAdvbox()
      .then((res) => {
        if (res.data) setSettings(res.data)
      })
      .catch((e) => console.warn('Erro ao carregar settings', e))
  }, [])

  // Buscar lista de processos
  const buscarProcessos = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRecarregando(true)
      else setCarregando(true)
      setErro(null)

      try {
        const query: Record<string, string | number> = { limit: 100 }
        if (buscaTexto.trim()) {
          // Se parecer número ou texto
          query.name = buscaTexto.trim()
        }
        if (faseFiltro) query.stage = faseFiltro
        if (tipoFiltro) query.type = tipoFiltro

        const res = await listarProcessosAdvbox(query)
        if (res.error) {
          setErro(res.error)
          setErroStatus(res.upstreamStatus || 500)
        } else if (res.data) {
          const list = (res.data as any).data || []
          setProcessos(Array.isArray(list) ? list : [])
          setTotalCount((res.data as any).totalCount || list.length)
        }
      } catch (err: any) {
        setErro(err?.message || 'Erro ao carregar processos do AdvBox.')
        setErroStatus(err?.status || 500)
      } finally {
        setCarregando(false)
        setRecarregando(false)
      }
    },
    [buscaTexto, faseFiltro, tipoFiltro],
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      buscarProcessos()
    }, 300)
    return () => clearTimeout(timeout)
  }, [buscarProcessos])

  // Abrir detalhe do processo
  const abrirProcesso = useCallback(
    async (id: number | string) => {
      setProcessoSelecionadoId(id)
      setSearchParams({ id: String(id) })
      setCarregandoDetalhe(true)
      setDetalheProcesso(null)
      setMovimentacoes([])
      setHistorico([])
      setPublicacoes([])

      try {
        const res = await obterProcessoAdvbox(id)
        if (res.data) {
          setDetalheProcesso(res.data)
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do processo', e)
      } finally {
        setCarregandoDetalhe(false)
      }
    },
    [setSearchParams],
  )

  // Sincronizar abertura por URL
  useEffect(() => {
    if (idFromUrl && !processoSelecionadoId) {
      abrirProcesso(idFromUrl)
    }
  }, [idFromUrl, processoSelecionadoId, abrirProcesso])

  // Carregar dados da aba selecionada no modal
  useEffect(() => {
    if (!processoSelecionadoId) return

    setCarregandoAba(true)
    if (abaAtiva === 'movimentacoes') {
      listarMovimentacoesAdvbox(processoSelecionadoId)
        .then((res) => {
          const list = (res.data as any)?.data || []
          setMovimentacoes(Array.isArray(list) ? list : [])
        })
        .catch(() => setMovimentacoes([]))
        .finally(() => setCarregandoAba(false))
    } else if (abaAtiva === 'historico') {
      obterHistoricoProcessoAdvbox(processoSelecionadoId)
        .then((res) => {
          const list = (res.data as any)?.data || (res.data as any) || []
          setHistorico(Array.isArray(list) ? list : [])
        })
        .catch(() => setHistorico([]))
        .finally(() => setCarregandoAba(false))
    } else if (abaAtiva === 'publicacoes') {
      listarPublicacoesProcessoAdvbox(processoSelecionadoId)
        .then((res) => {
          const list = (res.data as any)?.data || (res.data as any) || []
          setPublicacoes(Array.isArray(list) ? list : [])
        })
        .catch(() => setPublicacoes([]))
        .finally(() => setCarregandoAba(false))
    } else {
      setCarregandoAba(false)
    }
  }, [processoSelecionadoId, abaAtiva])

  const fecharModal = () => {
    setProcessoSelecionadoId(null)
    setDetalheProcesso(null)
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Processos AdvBox"
        descricao="Consulte todos os processos judiciais e administrativos sincronizados no AdvBox, com movimentações, histórico e publicações."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={() => buscarProcessos(true)}
            recarregando={recarregando}
          />
        )}

        {/* Barra de Filtros e Busca */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Input de Busca */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, número ou anotação..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-9 text-sm"
              />
              {buscaTexto && (
                <button
                  onClick={() => setBuscaTexto('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Select de Fase */}
            <div className="sm:col-span-3">
              <select
                value={faseFiltro}
                onChange={(e) => setFaseFiltro(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todas as fases processuais</option>
                {settings?.stages?.map((s) => (
                  <option key={s.id} value={s.stage}>
                    {s.stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Select de Tipo de Processo */}
            <div className="sm:col-span-3">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todos os tipos de ação</option>
                {settings?.lawsuit_types?.map((t) => (
                  <option key={t.id} value={t.type}>
                    {t.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Atualizar */}
            <div className="sm:col-span-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarProcessos(true)}
                disabled={recarregando || carregando}
                className="w-full h-9 text-xs"
                title="Recarregar processos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              {carregando
                ? 'Consultando AdvBox...'
                : `${totalCount} processo${totalCount === 1 ? '' : 's'} encontrado${totalCount === 1 ? '' : 's'}`}
            </span>
            {(faseFiltro || tipoFiltro || buscaTexto) && (
              <button
                onClick={() => {
                  setBuscaTexto('')
                  setFaseFiltro('')
                  setTipoFiltro('')
                }}
                className="text-teal-700 hover:text-teal-900 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Processos */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : processos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Nenhum processo encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {buscaTexto || faseFiltro || tipoFiltro
                ? 'Nenhum resultado correspondeu aos filtros aplicados. Tente remover os filtros para listar todos os processos.'
                : 'Ainda não há processos registrados na sua conta do AdvBox.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {processos.map((proc) => {
              const clientesNomes = Array.isArray(proc.customers)
                ? proc.customers
                    .map((c: any) => c.name)
                    .filter(Boolean)
                    .join(', ')
                : proc.customer_name || 'Cliente não identificado'

              return (
                <div
                  key={proc.id}
                  onClick={() => abrirProcesso(proc.id)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">
                        {proc.process_number || proc.protocol_number || `Processo #${proc.id}`}
                      </span>
                      {proc.stage && (
                        <Badge
                          variant="secondary"
                          className="bg-teal-50 text-teal-800 border-teal-200 text-[11px]"
                        >
                          {proc.stage}
                        </Badge>
                      )}
                      {proc.type && (
                        <Badge
                          variant="outline"
                          className="text-slate-600 border-slate-200 text-[11px]"
                        >
                          {proc.type}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {clientesNomes}
                      </span>
                      {proc.responsible && (
                        <span className="flex items-center gap-1 text-slate-500">
                          Resp.: {proc.responsible}
                        </span>
                      )}
                      {proc.folder && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
                          {proc.folder}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      {proc.fees_expec ? (
                        <p className="text-xs font-semibold text-slate-900">
                          {formatarMoeda(proc.fees_expec)}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-slate-400">
                        {proc.process_date
                          ? `Distr.: ${formatarData(proc.process_date)}`
                          : proc.created_at
                            ? `Criado: ${formatarData(proc.created_at)}`
                            : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-teal-700">
                      Abrir <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Detalhe Completo do Processo */}
        <Dialog open={!!processoSelecionadoId} onOpenChange={(open) => !open && fecharModal()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                  AdvBox ID #{processoSelecionadoId}
                </span>
                {detalheProcesso?.stage && (
                  <Badge variant="outline" className="text-teal-700 border-teal-300 text-[11px]">
                    {detalheProcesso.stage}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 mt-1">
                {detalheProcesso?.process_number ||
                  detalheProcesso?.protocol_number ||
                  `Processo #${processoSelecionadoId}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {detalheProcesso?.type || 'Ação Judicial'}
                {detalheProcesso?.responsible && ` · Responsável: ${detalheProcesso.responsible}`}
              </DialogDescription>
            </DialogHeader>

            {carregandoDetalhe ? (
              <div className="py-8 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Abas Internas do Processo */}
                <div className="flex space-x-1 border-b border-slate-200">
                  <button
                    onClick={() => setAbaAtiva('movimentacoes')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                      abaAtiva === 'movimentacoes'
                        ? 'border-teal-600 text-teal-900 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Movimentações (Andamentos)
                  </button>
                  <button
                    onClick={() => setAbaAtiva('historico')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                      abaAtiva === 'historico'
                        ? 'border-teal-600 text-teal-900 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    Histórico de Tarefas
                  </button>
                  <button
                    onClick={() => setAbaAtiva('publicacoes')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                      abaAtiva === 'publicacoes'
                        ? 'border-teal-600 text-teal-900 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Publicações do Diário
                  </button>
                  <button
                    onClick={() => setAbaAtiva('dados')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                      abaAtiva === 'dados'
                        ? 'border-teal-600 text-teal-900 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ficha Cadastral
                  </button>
                </div>

                {/* Conteúdo da Aba Movimentações */}
                {abaAtiva === 'movimentacoes' && (
                  <div className="space-y-3 py-2">
                    {carregandoAba ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : movimentacoes.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium">
                          Nenhuma movimentação processual registrada ainda no AdvBox.
                        </p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-teal-200 ml-3 pl-4 space-y-4 my-2">
                        {movimentacoes.map((m, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-teal-600 ring-4 ring-white" />
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className="font-semibold text-xs text-slate-900">
                                  {m.title || 'Andamento'}
                                </h4>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {m.date ? formatarData(m.date) : ''}
                                </span>
                              </div>
                              {m.header && (
                                <p className="text-[11px] text-teal-800 font-medium mt-0.5">
                                  {m.header}
                                </p>
                              )}
                              {m.description && (
                                <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                                  {m.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo da Aba Histórico */}
                {abaAtiva === 'historico' && (
                  <div className="space-y-3 py-2">
                    {carregandoAba ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : historico.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium">
                          Nenhum histórico de tarefa registrado.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {historico.map((h, idx) => (
                          <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-slate-900">
                                {h.task || h.title || 'Tarefa processual'}
                              </p>
                              {h.notes && (
                                <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {h.date ? formatarData(h.date) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo da Aba Publicações */}
                {abaAtiva === 'publicacoes' && (
                  <div className="space-y-3 py-2">
                    {carregandoAba ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : publicacoes.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium">
                          Nenhuma publicação do Diário da Justiça encontrada para este processo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {publicacoes.map((pub, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-semibold text-xs text-slate-900">
                                {pub.title || 'Publicação Oficial'}
                              </h5>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {pub.date ? formatarData(pub.date) : ''}
                              </span>
                            </div>
                            {pub.source && (
                              <p className="text-[11px] text-teal-700 font-medium">
                                Fonte: {pub.source}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 whitespace-pre-wrap mt-1">
                              {pub.content || pub.description || 'Sem texto adicional capturado.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo da Aba Ficha Cadastral */}
                {abaAtiva === 'dados' && detalheProcesso && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                        Dados Básicos
                      </p>
                      <div>
                        <span className="text-slate-500">Pasta: </span>
                        <span className="font-medium text-slate-800">
                          {detalheProcesso.folder || 'Nenhuma'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Passo / Etapa: </span>
                        <span className="font-medium text-slate-800">
                          {detalheProcesso.step || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Data do Processo: </span>
                        <span className="font-medium text-slate-800">
                          {detalheProcesso.process_date
                            ? formatarData(detalheProcesso.process_date)
                            : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                        Financeiro do Processo
                      </p>
                      <div>
                        <span className="text-slate-500">Expectativa de Honorários: </span>
                        <span className="font-medium text-slate-800">
                          {detalheProcesso.fees_expec
                            ? formatarMoeda(detalheProcesso.fees_expec)
                            : 'Não estipulado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Honorários Recebidos: </span>
                        <span className="font-medium text-slate-800">
                          {detalheProcesso.fees_money
                            ? formatarMoeda(detalheProcesso.fees_money)
                            : 'R$ 0,00'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
