import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  DollarSign,
  Activity,
  Cake,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvboxNavHeader } from '@/components/AdvboxNavHeader'
import { AdvboxErrorBanner } from '@/components/AdvboxErrorBanner'
import {
  obterConfiguracoesAdvbox,
  listarUltimasMovimentacoesAdvbox,
  listarAniversariantesAdvbox,
  listarProcessosAdvbox,
  listarContatosAdvbox,
  listarTransacoesAdvbox,
  AdvboxSettings,
} from '@/services/advbox'
import { formatarData } from '@/lib/formatadores'

export default function AdvboxDashboard() {
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [settings, setSettings] = useState<AdvboxSettings | null>(null)
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<any[]>([])
  const [aniversariantes, setAniversariantes] = useState<any[]>([])
  const [totais, setTotais] = useState({
    processos: 0,
    clientes: 0,
    transacoes: 0,
  })

  const carregarDados = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRecarregando(true)
    else setCarregando(true)
    setErro(null)

    try {
      // 1. Carregar Settings (validação de conexão)
      const settingsRes = await obterConfiguracoesAdvbox()
      if (settingsRes.error) {
        setErro(settingsRes.error)
        setErroStatus(settingsRes.upstreamStatus || 500)
      } else if (settingsRes.data) {
        setSettings(settingsRes.data)
      }

      // 2. Carregar Últimos Andamentos
      try {
        const movRes = await listarUltimasMovimentacoesAdvbox({ limit: 8 })
        if (movRes.data && Array.isArray((movRes.data as any).data)) {
          setUltimasMovimentacoes((movRes.data as any).data)
        }
      } catch (e) {
        console.warn('Erro ao carregar últimas movimentações AdvBox', e)
      }

      // 3. Carregar Aniversariantes do Mês
      try {
        const mesAtual = new Date().getMonth() + 1
        const anivRes = await listarAniversariantesAdvbox({ month: mesAtual, limit: 8 })
        if (anivRes.data && Array.isArray((anivRes.data as any).data)) {
          setAniversariantes((anivRes.data as any).data)
        }
      } catch (e) {
        console.warn('Erro ao carregar aniversariantes AdvBox', e)
      }

      // 4. Carregar totais gerais
      try {
        const [procRes, cliRes, transRes] = await Promise.allSettled([
          listarProcessosAdvbox({ limit: 1 }),
          listarContatosAdvbox({ limit: 1 }),
          listarTransacoesAdvbox({ limit: 1 }),
        ])

        setTotais({
          processos:
            procRes.status === 'fulfilled' && (procRes.value.data as any)?.totalCount !== undefined
              ? (procRes.value.data as any).totalCount
              : 0,
          clientes:
            cliRes.status === 'fulfilled' && (cliRes.value.data as any)?.totalCount !== undefined
              ? (cliRes.value.data as any).totalCount
              : 0,
          transacoes:
            transRes.status === 'fulfilled' &&
            (transRes.value.data as any)?.totalCount !== undefined
              ? (transRes.value.data as any).totalCount
              : 0,
        })
      } catch (e) {
        console.warn('Erro ao carregar totais', e)
      }
    } catch (err: any) {
      setErro(err?.message || 'Falha ao conectar à API AdvBox.')
      setErroStatus(err?.status || 500)
    } finally {
      setCarregando(false)
      setRecarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const mesAtualNome = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Painel AdvBox"
        descricao="Visão integrada em tempo real da conta AdvBox do escritório: equipe, processos, contatos e finanças."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={() => carregarDados(true)}
            recarregando={recarregando}
          />
        )}

        {/* Status de Conexão com AdvBox */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                settings ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {settings ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {settings ? 'Conexão AdvBox Estabelecida' : 'Aguardando Sincronização'}
                </h2>
                <Badge
                  variant="outline"
                  className={
                    settings
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px]'
                      : 'border-amber-300 bg-amber-50 text-amber-800 text-[11px]'
                  }
                >
                  {settings ? 'Online · API v1' : 'Pendente'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings
                  ? `${settings.users?.length || 0} usuários, ${settings.stages?.length || 0} fases processuais e ${settings.lawsuit_types?.length || 0} tipos de ação ativos na conta.`
                  : 'Tentando validar credencial configurada no backend.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => carregarDados(true)}
            disabled={recarregando || carregando}
            className="text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recarregando ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Cards de Métricas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Processos no AdvBox
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {totais.processos.toLocaleString('pt-BR')}
                  </h3>
                )}
                <Link
                  to="/advbox/processos"
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 mt-2"
                >
                  Ver todos os processos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Briefcase className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Clientes & Contatos
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {totais.clientes.toLocaleString('pt-BR')}
                  </h3>
                )}
                <Link
                  to="/advbox/clientes"
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 mt-2"
                >
                  Ver contatos cadastrados <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Lançamentos Financeiros
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {totais.transacoes.toLocaleString('pt-BR')}
                  </h3>
                )}
                <Link
                  to="/advbox/financeiro"
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 mt-2"
                >
                  Acessar fluxo financeiro <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade de 2 colunas: Últimas Movimentações e Aniversariantes/Configurações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Últimos Andamentos dos Processos */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-700" />
                    Últimas Movimentações Processuais
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Andamento mais recente capturado por processo via GET /last_movements
                  </CardDescription>
                </div>
                <Link
                  to="/advbox/processos"
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium"
                >
                  Ver todos
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                {carregando ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : ultimasMovimentacoes.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <Activity className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Nenhum andamento recente registrado.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Os novos andamentos sincronizados no AdvBox aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ultimasMovimentacoes.map((mov, idx) => (
                      <div
                        key={mov.lawsuit_id || idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900">
                              {mov.title || 'Andamento processual'}
                            </span>
                            {mov.header && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                {mov.header}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">
                            {mov.process_number ? `Proc. ${mov.process_number}` : 'Sem número CNJ'}
                            {mov.customers && ` · ${mov.customers}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {mov.date ? formatarData(mov.date) : '—'}
                          </span>
                          {mov.lawsuit_id && (
                            <Link
                              to={`/advbox/processos?id=${mov.lawsuit_id}`}
                              className="text-xs text-teal-700 hover:text-teal-900 font-medium"
                            >
                              Ver ficha
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadados da Conta AdvBox */}
            {settings && (
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-700" />
                    Estrutura da Conta AdvBox
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mapeamento automático de usuários, fases e tipos configurados no escritório
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Equipe AdvBox ({settings.users?.length || 0})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto text-xs text-slate-600 scrollbar-thin">
                        {settings.users?.map((u) => (
                          <div key={u.id} className="truncate">
                            • {u.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Fases Processuais ({settings.stages?.length || 0})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto text-xs text-slate-600 scrollbar-thin">
                        {settings.stages?.map((s) => (
                          <div key={s.id} className="truncate">
                            • {s.stage}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Tipos de Ação ({settings.lawsuit_types?.length || 0})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto text-xs text-slate-600 scrollbar-thin">
                        {settings.lawsuit_types?.map((t) => (
                          <div key={t.id} className="truncate">
                            • {t.type}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna 3: Aniversariantes do Mês e Ações Rápidas */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-600" />
                  Aniversariantes ({mesAtualNome})
                </CardTitle>
                <CardDescription className="text-xs">
                  Relacionamento com clientes do mês via GET /customers/birthdays
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {carregando ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : aniversariantes.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">
                    <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-medium">
                      Nenhum aniversariante cadastrado para este mês.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {aniversariantes.map((cli, idx) => (
                      <div
                        key={cli.id || idx}
                        className="py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{cli.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {cli.cellphone || cli.phone || cli.email || 'Sem contato'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[11px] border-pink-200 text-pink-700 bg-pink-50 shrink-0"
                        >
                          {cli.birthdate || 'Data N/D'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acesso rápido às ferramentas AdvBox */}
            <Card className="border-slate-200 bg-linear-to-br from-slate-900 to-teal-950 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white">Módulos AdvBox</CardTitle>
                <CardDescription className="text-teal-200 text-xs">
                  Acesso rápido para toda a equipe do escritório
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Link
                  to="/advbox/processos"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-teal-300" />
                    Fichas, Prazos e Diário
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-teal-300" />
                </Link>

                <Link
                  to="/advbox/financeiro"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-300" />
                    Honorários e Custas
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-teal-300" />
                </Link>

                <Link
                  to="/advbox/tarefas"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-teal-300" />
                    Tarefas e Protocolos
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-teal-300" />
                </Link>

                <Link
                  to="/advbox/documentos"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-300" />
                    Documentos e Anexos S3
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-teal-300" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
