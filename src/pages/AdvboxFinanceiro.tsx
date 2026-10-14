import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvboxNavHeader } from '@/components/AdvboxNavHeader'
import { AdvboxErrorBanner } from '@/components/AdvboxErrorBanner'
import { listarTransacoesAdvbox, obterConfiguracoesAdvbox, AdvboxSettings } from '@/services/advbox'
import { formatarData, formatarMoeda } from '@/lib/formatadores'

export default function AdvboxFinanceiro() {
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [transacoes, setTransacoes] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [settings, setSettings] = useState<AdvboxSettings | null>(null)

  // Filtros
  const [buscaDescricao, setBuscaDescricao] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'income' | 'expense'>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(() => {
    obterConfiguracoesAdvbox()
      .then((res) => {
        if (res.data) setSettings(res.data)
      })
      .catch((e) => console.warn('Erro ao carregar settings financeiro', e))
  }, [])

  const buscarTransacoes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRecarregando(true)
      else setCarregando(true)
      setErro(null)

      try {
        const query: Record<string, string | number> = { limit: 100 }
        if (buscaDescricao.trim()) query.description = buscaDescricao.trim()
        if (filtroCategoria) query.category = filtroCategoria

        const res = await listarTransacoesAdvbox(query)
        if (res.error) {
          setErro(res.error)
          setErroStatus(res.upstreamStatus || 500)
        } else if (res.data) {
          const list = (res.data as any).data || []
          setTransacoes(Array.isArray(list) ? list : [])
          setTotalCount((res.data as any).totalCount || list.length)
        }
      } catch (err: any) {
        setErro(err?.message || 'Erro ao carregar lançamentos financeiros do AdvBox.')
        setErroStatus(err?.status || 500)
      } finally {
        setCarregando(false)
        setRecarregando(false)
      }
    },
    [buscaDescricao, filtroCategoria],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarTransacoes()
    }, 300)
    return () => clearTimeout(timer)
  }, [buscarTransacoes])

  // Filtrar localmente por entry_type (income/expense) se selecionado
  const transacoesFiltradas = useMemo(() => {
    if (filtroTipo === 'todos') return transacoes
    return transacoes.filter((t) => t.entry_type === filtroTipo)
  }, [transacoes, filtroTipo])

  // Totais calculados
  const totaisCalculados = useMemo(() => {
    let receitas = 0
    let despesas = 0

    transacoes.forEach((t) => {
      const val =
        typeof t.amount === 'number'
          ? t.amount
          : parseFloat(String(t.amount || '0').replace(',', '.')) || 0
      if (t.entry_type === 'income') receitas += val
      else if (t.entry_type === 'expense') despesas += val
    })

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    }
  }, [transacoes])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Financeiro AdvBox"
        descricao="Fluxo de caixa integrado: honorários, custas, despesas e receitas sincronizadas com a conta AdvBox."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={() => buscarTransacoes(true)}
            recarregando={recarregando}
          />
        )}

        {/* Totais do Topo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Receitas (Honorários)
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {formatarMoeda(totaisCalculados.receitas)}
                  </h3>
                )}
                <p className="text-xs text-slate-500 mt-1">Lançamentos do período carregado</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  Despesas & Custas
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {formatarMoeda(totaisCalculados.despesas)}
                  </h3>
                )}
                <p className="text-xs text-slate-500 mt-1">Custas e despesas do escritório</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <TrendingDown className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Saldo Líquido
                </p>
                {carregando ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <h3
                    className={`text-2xl font-bold mt-1 ${
                      totaisCalculados.saldo >= 0 ? 'text-slate-900' : 'text-rose-700'
                    }`}
                  >
                    {formatarMoeda(totaisCalculados.saldo)}
                  </h3>
                )}
                <p className="text-xs text-slate-500 mt-1">Diferença apurada no AdvBox</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por descrição ou cliente..."
                value={buscaDescricao}
                onChange={(e) => setBuscaDescricao(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <div className="flex rounded-md shadow-xs h-9">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`flex-1 px-2 text-xs font-medium rounded-l-md border transition ${
                    filtroTipo === 'todos'
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('income')}
                  className={`flex-1 px-2 text-xs font-medium border-y border-r transition ${
                    filtroTipo === 'income'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Receitas
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('expense')}
                  className={`flex-1 px-2 text-xs font-medium rounded-r-md border-y border-r transition ${
                    filtroTipo === 'expense'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Despesas
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todas as categorias</option>
                {settings?.financial?.categories?.map((c) => (
                  <option key={c.id} value={c.category}>
                    {c.category} ({c.type === 'income' ? 'Receita' : 'Despesa'})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarTransacoes(true)}
                disabled={recarregando || carregando}
                className="w-full h-9 text-xs"
                title="Recarregar lançamentos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              {carregando
                ? 'Consultando finanças AdvBox...'
                : `${transacoesFiltradas.length} lançamento${transacoesFiltradas.length === 1 ? '' : 's'} exibido${transacoesFiltradas.length === 1 ? '' : 's'}`}
            </span>
            {(buscaDescricao || filtroCategoria || filtroTipo !== 'todos') && (
              <button
                onClick={() => {
                  setBuscaDescricao('')
                  setFiltroCategoria('')
                  setFiltroTipo('todos')
                }}
                className="text-teal-700 hover:text-teal-900 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Transações */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : transacoesFiltradas.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Nenhuma transação encontrada</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {buscaDescricao || filtroCategoria || filtroTipo !== 'todos'
                ? 'Nenhum lançamento correspondeu aos filtros aplicados.'
                : 'Ainda não há lançamentos financeiros registrados no AdvBox.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tipo</th>
                    <th className="py-3 px-4 font-semibold">Descrição / Categoria</th>
                    <th className="py-3 px-4 font-semibold">Cliente / Processo</th>
                    <th className="py-3 px-4 font-semibold">Vencimento</th>
                    <th className="py-3 px-4 font-semibold">Pagamento</th>
                    <th className="py-3 px-4 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transacoesFiltradas.map((t) => {
                    const isReceita = t.entry_type === 'income'
                    const pago = !!t.date_payment
                    const valor =
                      typeof t.amount === 'number'
                        ? t.amount
                        : parseFloat(String(t.amount || '0').replace(',', '.')) || 0

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={
                              isReceita
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]'
                                : 'border-rose-300 bg-rose-50 text-rose-800 text-[10px]'
                            }
                          >
                            {isReceita ? 'Receita' : 'Despesa'}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {t.description || t.category || 'Lançamento'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t.category && t.description ? t.category : ''}
                            {t.cost_center ? ` · C.C.: ${t.cost_center}` : ''}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">
                            {t.name || t.customer_name || 'Geral do escritório'}
                          </p>
                          {t.process_number && (
                            <p className="text-[11px] text-slate-500 font-mono">
                              Proc. {t.process_number}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {t.date_due ? formatarData(t.date_due) : '—'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {pago ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <CheckCircle2 className="h-3 w-3" />
                              {formatarData(t.date_payment)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                              <Clock className="h-3 w-3" />
                              Em aberto
                            </span>
                          )}
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                            isReceita ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isReceita ? '+' : '-'} {formatarMoeda(valor)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
