import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarCNJ, formatarData } from '@/lib/formatadores'
import { listarPrazosProximos, alternarCumpridoMovimentacao } from '@/services/movimentacoes'
import type { Movimentacao } from '@/types/juridico'
import { toast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/EmptyState'

export const Agenda = () => {
  const [prazos, setPrazos] = useState<Movimentacao[]>([])
  const [filtro, setFiltro] = useState<'todos' | '7dias' | '30dias'>('todos')
  const [carregando, setCarregando] = useState(true)

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await listarPrazosProximos()
      setPrazos(lista)
    } catch {
      toast({
        title: 'Erro ao carregar agenda',
        description: 'Não foi possível carregar os prazos e compromissos.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const toggleCumprido = async (mov: Movimentacao) => {
    try {
      await alternarCumpridoMovimentacao(mov.id, true)
      setPrazos((prev) => prev.filter((p) => p.id !== mov.id))
      toast({
        title: 'Prazo cumprido com sucesso!',
        description: `O compromisso "${mov.titulo}" foi concluído.`,
      })
    } catch {
      toast({
        title: 'Erro ao marcar cumprimento',
        variant: 'destructive',
      })
    }
  }

  // Filtrar por janela de dias
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const prazosFiltrados = prazos.filter((p) => {
    if (!p.prazo_fatal) return false
    if (filtro === 'todos') return true

    const dataPrazo = new Date(p.prazo_fatal)
    const diffDias = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 3600 * 24))

    if (filtro === '7dias') return diffDias <= 7
    if (filtro === '30dias') return diffDias <= 30
    return true
  })

  // Destacar prazos nos próximos 7 dias
  const prazos7Dias = prazos.filter((p) => {
    if (!p.prazo_fatal) return false
    const d = new Date(p.prazo_fatal)
    const diff = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 3600 * 24))
    return diff <= 7
  })

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agenda & Prazos Processuais
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {prazos.length} pendentes
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Controle integrado de audiências, contestações, recursos e prazos fatais da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filtro === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro('todos')}
            className={filtro === 'todos' ? 'bg-teal-700 text-white' : ''}
          >
            Todos ({prazos.length})
          </Button>
          <Button
            variant={filtro === '7dias' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro('7dias')}
            className={filtro === '7dias' ? 'bg-amber-600 text-white' : 'text-amber-800'}
          >
            Próximos 7 Dias ({prazos7Dias.length})
          </Button>
          <Button
            variant={filtro === '30dias' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltro('30dias')}
            className={filtro === '30dias' ? 'bg-teal-700 text-white' : ''}
          >
            Próximos 30 Dias
          </Button>
        </div>
      </div>

      {/* Banner de alerta caso haja prazos nos próximos 7 dias */}
      {prazos7Dias.length > 0 && filtro !== '7dias' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Atenção da equipe: </span>
              Existem <strong>{prazos7Dias.length} prazos fatais ou audiências</strong> com
              vencimento nos próximos 7 dias!
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltro('7dias')}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            Filtrar 7 dias
          </Button>
        </div>
      )}

      {/* Lista de Prazos */}
      {carregando ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando agenda…</div>
      ) : prazosFiltrados.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-10 w-10 text-emerald-600" />}
          titulo="Agenda em dia!"
          descricao="Não há prazos fatais pendentes para o período selecionado."
          acaoTexto="Ver Todos os Processos"
          onAcao={() => (window.location.href = '/processos')}
        />
      ) : (
        <div className="space-y-3">
          {prazosFiltrados.map((prazo) => {
            const dataPrazo = new Date(prazo.prazo_fatal!)
            const diffDias = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 3600 * 24))
            const eUrgente = diffDias <= 3
            const eSemana = diffDias <= 7

            return (
              <Card
                key={prazo.id}
                className={`transition-all hover:shadow-sm group border-l-4 ${
                  eUrgente
                    ? 'border-l-rose-500 bg-rose-50/20'
                    : eSemana
                      ? 'border-l-amber-500 bg-amber-50/10'
                      : 'border-l-teal-600 bg-white'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono ${
                          eUrgente
                            ? 'bg-rose-100 text-rose-800'
                            : eSemana
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-teal-100 text-teal-900'
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {formatarData(prazo.prazo_fatal)}
                        {diffDias === 0 && ' (Hoje!)'}
                        {diffDias === 1 && ' (Amanhã)'}
                        {diffDias > 1 && ` (em ${diffDias} dias)`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {prazo.tipo}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {prazo.titulo}
                    </h3>

                    {prazo.descricao && (
                      <p className="text-xs text-slate-600 line-clamp-2">{prazo.descricao}</p>
                    )}

                    {prazo.expand?.processo && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                        <Link
                          to={`/processos/${prazo.expand.processo.id}`}
                          className="font-mono text-teal-700 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Briefcase className="h-3 w-3" />
                          {formatarCNJ(prazo.expand.processo.numero_cnj)}
                        </Link>
                        {prazo.expand.processo.expand?.cliente && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <User className="h-3 w-3 text-slate-400" />
                            Cliente: {prazo.expand.processo.expand.cliente.nome}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      onClick={() => toggleCumprido(prazo)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Marcar Cumprido
                    </Button>
                    {prazo.expand?.processo?.id && (
                      <Button asChild variant="outline" size="sm" className="text-xs h-8">
                        <Link to={`/processos/${prazo.expand.processo.id}`}>Ver Autos &rarr;</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Agenda
