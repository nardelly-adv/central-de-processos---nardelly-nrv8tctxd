import { useState, useEffect, useCallback } from 'react'
import {
  CheckSquare,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Briefcase,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvboxNavHeader } from '@/components/AdvboxNavHeader'
import { AdvboxErrorBanner } from '@/components/AdvboxErrorBanner'
import { listarTarefasAdvbox, obterConfiguracoesAdvbox, AdvboxSettings } from '@/services/advbox'
import { formatarData } from '@/lib/formatadores'

export default function AdvboxTarefas() {
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [tarefas, setTarefas] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [settings, setSettings] = useState<AdvboxSettings | null>(null)

  // Filtros
  const [buscaTexto, setBuscaTexto] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')

  useEffect(() => {
    obterConfiguracoesAdvbox()
      .then((res) => {
        if (res.data) setSettings(res.data)
      })
      .catch((e) => console.warn('Erro ao carregar settings', e))
  }, [])

  const buscarTarefas = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRecarregando(true)
      else setCarregando(true)
      setErro(null)

      try {
        const query: Record<string, string | number> = { limit: 100 }
        if (filtroUsuario) query.user_name = filtroUsuario

        const res = await listarTarefasAdvbox(query)
        if (res.error) {
          setErro(res.error)
          setErroStatus(res.upstreamStatus || 500)
        } else if (res.data) {
          const list = (res.data as any).data || []
          setTarefas(Array.isArray(list) ? list : [])
          setTotalCount((res.data as any).totalCount || list.length)
        }
      } catch (err: any) {
        setErro(err?.message || 'Erro ao carregar tarefas do AdvBox.')
        setErroStatus(err?.status || 500)
      } finally {
        setCarregando(false)
        setRecarregando(false)
      }
    },
    [filtroUsuario],
  )

  useEffect(() => {
    buscarTarefas()
  }, [buscarTarefas])

  // Filtragem adicional local por texto de busca (notes, task, lawsuit)
  const tarefasFiltradas = tarefas.filter((t) => {
    if (!buscaTexto.trim()) return true
    const q = buscaTexto.toLowerCase()
    const taskName = String(t.task || '').toLowerCase()
    const notes = String(t.notes || '').toLowerCase()
    const proc = String(t.lawsuit?.process_number || '').toLowerCase()
    const cli = Array.isArray(t.lawsuit?.customers)
      ? t.lawsuit.customers.map((c: any) => String(c.name || '').toLowerCase()).join(' ')
      : ''
    return taskName.includes(q) || notes.includes(q) || proc.includes(q) || cli.includes(q)
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Tarefas & Atividades AdvBox"
        descricao="Acompanhe as tarefas, protocolos e prazos internos distribuídos para a equipe no AdvBox."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={() => buscarTarefas(true)}
            recarregando={recarregando}
          />
        )}

        {/* Filtros */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por tipo de tarefa, observações, cliente ou processo..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todos os responsáveis da equipe</option>
                {settings?.users?.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarTarefas(true)}
                disabled={recarregando || carregando}
                className="w-full h-9 text-xs"
                title="Recarregar tarefas"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              {carregando
                ? 'Consultando tarefas AdvBox...'
                : `${tarefasFiltradas.length} tarefa${tarefasFiltradas.length === 1 ? '' : 's'} encontrada${tarefasFiltradas.length === 1 ? '' : 's'}`}
            </span>
            {(buscaTexto || filtroUsuario) && (
              <button
                onClick={() => {
                  setBuscaTexto('')
                  setFiltroUsuario('')
                }}
                className="text-teal-700 hover:text-teal-900 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Tarefas */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : tarefasFiltradas.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Nenhuma tarefa encontrada</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {buscaTexto || filtroUsuario
                ? 'Nenhuma tarefa corresponde aos filtros aplicados.'
                : 'Ainda não há tarefas ou atividades registradas no AdvBox.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tarefasFiltradas.map((t) => {
              const clientes = Array.isArray(t.lawsuit?.customers)
                ? t.lawsuit.customers
                    .map((c: any) => c.name)
                    .filter(Boolean)
                    .join(', ')
                : ''
              const usuariosNomes = Array.isArray(t.users)
                ? t.users
                    .map((u: any) => u.name)
                    .filter(Boolean)
                    .join(', ')
                : ''
              const isUrgente = Array.isArray(t.users) && t.users.some((u: any) => u.urgent === 1)
              const isImportante =
                Array.isArray(t.users) && t.users.some((u: any) => u.important === 1)

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-900">
                        {t.task || 'Tarefa sem título'}
                      </h4>
                      {isUrgente && (
                        <Badge variant="destructive" className="text-[10px] py-0">
                          Urgente
                        </Badge>
                      )}
                      {isImportante && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] py-0"
                        >
                          Importante
                        </Badge>
                      )}
                      {t.reward ? (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {t.reward} pts
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      {t.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatarData(t.date)}
                        </span>
                      )}
                      {t.date_deadline && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="h-3 w-3" />
                          Prazo: {formatarData(t.date_deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {t.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 whitespace-pre-wrap">
                      {t.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-3 flex-wrap">
                      {t.lawsuit?.process_number && (
                        <span className="font-mono text-slate-700 font-medium">
                          Proc.: {t.lawsuit.process_number}
                        </span>
                      )}
                      {clientes && <span>Cliente: {clientes}</span>}
                    </div>

                    {usuariosNomes && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        {usuariosNomes}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
