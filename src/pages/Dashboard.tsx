import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Clock,
  FileCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  FileText,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, AreaBadge } from '@/components/StatusBadges'
import { formatarCNJ, formatarData, formatarMoeda } from '@/lib/formatadores'
import { listarProcessos } from '@/services/processos'
import { listarClientes } from '@/services/clientes'
import { listarTodasMovimentacoes, listarPrazosProximos } from '@/services/movimentacoes'
import { listarDocumentos } from '@/services/documentos'
import type { Processo, Cliente, Movimentacao, Documento } from '@/types/juridico'
import pb from '@/lib/pocketbase/client'

export const Dashboard = () => {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [prazos, setPrazos] = useState<Movimentacao[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [carregando, setCarregando] = useState(true)

  const usuario = pb.authStore.record

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)
      try {
        const [listaProc, listaCli, listaMov, listaPraz, listaDocs] = await Promise.all([
          listarProcessos(),
          listarClientes(),
          listarTodasMovimentacoes(8),
          listarPrazosProximos(),
          listarDocumentos(),
        ])
        setProcessos(listaProc)
        setClientes(listaCli)
        setMovimentacoes(listaMov)
        setPrazos(listaPraz)
        setDocumentos(listaDocs)
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err)
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  const ativos = processos.filter((p) => p.status === 'Ativo')
  const suspensos = processos.filter((p) => p.status === 'Suspenso')
  const valorTotalCausas = processos.reduce((acc, p) => acc + (p.valor_causa || 0), 0)

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Boas-vindas e Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-200 border border-teal-400/30">
            Advocacia & Consultoria Jurídica
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {usuario?.name || 'Equipe'}!</h1>
          <p className="text-teal-100/80 text-sm max-w-xl">
            Bem-vindo à Central de Processos. Aqui você acompanha prazos, clientes, movimentações e
            documentos do escritório de forma unificada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <Button
            asChild
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-sm"
          >
            <Link to="/processos?novo=1">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Novo Processo
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-teal-400/40 text-teal-100 hover:bg-teal-800 hover:text-white"
          >
            <Link to="/clientes?novo=1">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Processos Ativos
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {carregando ? '—' : ativos.length}
              </h3>
              <p className="text-xs text-slate-500">De um total de {processos.length} processos</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Prazos & Audiências
              </p>
              <h3 className="text-2xl font-bold text-amber-600">
                {carregando ? '—' : prazos.length}
              </h3>
              <p className="text-xs text-slate-500">Compromissos pendentes</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Clientes Cadastrados
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {carregando ? '—' : clientes.length}
              </h3>
              <p className="text-xs text-slate-500">Pessoas físicas e jurídicas</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 hover:border-teal-300 transition-all shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Valor em Causas
              </p>
              <h3 className="text-xl font-bold text-emerald-700">
                {carregando ? '—' : formatarMoeda(valorTotalCausas)}
              </h3>
              <p className="text-xs text-slate-500">{documentos.length} docs na biblioteca</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo em Duas Colunas: Prazos Críticos + Movimentações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Principal: Prazos Próximos & Destaques de Processos (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  Próximos Prazos e Audiências
                </CardTitle>
                <CardDescription className="text-xs">
                  Atenção aos compromissos com data fatal nos próximos dias
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs text-teal-700 hover:text-teal-800"
              >
                <Link to="/agenda">Ver agenda completa &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {prazos.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <FileCheck className="h-8 w-8 text-teal-600 mx-auto mb-2 opacity-60" />
                  Nenhum prazo pendente no momento! Todos os andamentos estão em dia.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {prazos.slice(0, 5).map((prazo) => (
                    <div
                      key={prazo.id}
                      className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/80 rounded-lg px-2 transition"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Prazo: {formatarData(prazo.prazo_fatal)}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{prazo.tipo}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {prazo.titulo}
                        </p>
                        {prazo.expand?.processo && (
                          <p className="text-xs text-slate-500 truncate">
                            Processo: {prazo.expand.processo.numero_cnj} —{' '}
                            {prazo.expand.processo.titulo}
                          </p>
                        )}
                      </div>
                      {prazo.expand?.processo?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="shrink-0 h-8 text-xs"
                        >
                          <Link to={`/processos/${prazo.expand.processo.id}`}>Ver autos</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processos Ativos Recentes */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal-700" />
                  Processos Ativos em Andamento
                </CardTitle>
                <CardDescription className="text-xs">
                  Últimos processos cadastrados no escritório
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-xs text-teal-700 hover:text-teal-800"
              >
                <Link to="/processos">Ver todos ({processos.length}) &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {processos.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Nenhum processo cadastrado.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {processos.slice(0, 4).map((proc) => (
                    <Link
                      key={proc.id}
                      to={`/processos/${proc.id}`}
                      className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/80 rounded-lg px-2 transition block group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-700 group-hover:text-teal-700 transition">
                            {formatarCNJ(proc.numero_cnj)}
                          </span>
                          <AreaBadge area={proc.area} />
                          <StatusBadge status={proc.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{proc.titulo}</p>
                        <p className="text-xs text-slate-500 truncate">
                          Cliente: {proc.expand?.cliente?.nome || '—'} · Vara:{' '}
                          {proc.vara || proc.comarca || 'Não especificada'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition shrink-0 mt-2" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Andamentos Recentes & Atalhos Úteis (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timeline de Andamentos Recentes */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                Andamentos Recentes
              </CardTitle>
              <CardDescription className="text-xs">
                Últimas movimentações registradas pela equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length === 0 ? (
                <p className="text-center py-6 text-slate-500 text-sm">
                  Nenhuma movimentação recente registrada.
                </p>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                  {movimentacoes.slice(0, 5).map((mov) => (
                    <div key={mov.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatarData(mov.data)}
                          </span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                            {mov.tipo}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 leading-snug">
                          {mov.titulo}
                        </p>
                        {mov.expand?.processo && (
                          <Link
                            to={`/processos/${mov.expand.processo.id}`}
                            className="text-xs text-teal-700 hover:underline block truncate"
                          >
                            {mov.expand.processo.numero_cnj}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atalhos e Estatísticas de Clientes */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-teal-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-700" />
                Acesso Rápido a Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {clientes.slice(0, 3).map((cli) => (
                  <Link
                    key={cli.id}
                    to={`/clientes/${cli.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-teal-400 hover:shadow-xs transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{cli.nome}</p>
                      <p className="text-[11px] text-slate-500">
                        {cli.cidade || 'Brasil'} · {cli.email || cli.telefone || 'Sem contato'}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link to="/clientes">Ver todos os clientes ({clientes.length})</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
