import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Cake,
  X,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react'
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
import { listarContatosAdvbox, obterContatoAdvbox } from '@/services/advbox'
import { formatarCPFouCNPJ, formatarTelefone, formatarData } from '@/lib/formatadores'

export default function AdvboxClientes() {
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [clientes, setClientes] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Filtros
  const [buscaNome, setBuscaNome] = useState('')
  const [buscaCpf, setBuscaCpf] = useState('')
  const [buscaEmail, setBuscaEmail] = useState('')

  // Detalhe do Contato
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | string | null>(null)
  const [detalheCliente, setDetalheCliente] = useState<any | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)

  const buscarContatos = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRecarregando(true)
      else setCarregando(true)
      setErro(null)

      try {
        const query: Record<string, string | number> = { limit: 100 }
        if (buscaNome.trim()) query.name = buscaNome.trim()
        if (buscaCpf.trim()) query.identification = buscaCpf.trim()
        if (buscaEmail.trim()) query.email = buscaEmail.trim()

        const res = await listarContatosAdvbox(query)
        if (res.error) {
          setErro(res.error)
          setErroStatus(res.upstreamStatus || 500)
        } else if (res.data) {
          const list = (res.data as any).data || []
          setClientes(Array.isArray(list) ? list : [])
          setTotalCount((res.data as any).totalCount || list.length)
        }
      } catch (err: any) {
        setErro(err?.message || 'Erro ao carregar clientes do AdvBox.')
        setErroStatus(err?.status || 500)
      } finally {
        setCarregando(false)
        setRecarregando(false)
      }
    },
    [buscaNome, buscaCpf, buscaEmail],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarContatos()
    }, 300)
    return () => clearTimeout(timer)
  }, [buscarContatos])

  const abrirCliente = async (id: number | string) => {
    setClienteSelecionadoId(id)
    setCarregandoDetalhe(true)
    setDetalheCliente(null)
    try {
      const res = await obterContatoAdvbox(id)
      if (res.data) {
        setDetalheCliente(res.data)
      }
    } catch (e) {
      console.warn('Erro ao carregar detalhe do contato', e)
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  const fecharModal = () => {
    setClienteSelecionadoId(null)
    setDetalheCliente(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Clientes & Contatos AdvBox"
        descricao="Base completa de clientes, leads e pessoas vinculadas sincronizadas com a conta AdvBox."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={() => buscarContatos(true)}
            recarregando={recarregando}
          />
        )}

        {/* Barra de Filtros */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome do contato..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                placeholder="Filtrar CPF ou CNPJ..."
                value={buscaCpf}
                onChange={(e) => setBuscaCpf(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                placeholder="Filtrar por e-mail..."
                value={buscaEmail}
                onChange={(e) => setBuscaEmail(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarContatos(true)}
                disabled={recarregando || carregando}
                className="w-full h-9 text-xs"
                title="Atualizar lista"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              {carregando
                ? 'Buscando clientes...'
                : `${totalCount} contato${totalCount === 1 ? '' : 's'} cadastrado${totalCount === 1 ? '' : 's'}`}
            </span>
            {(buscaNome || buscaCpf || buscaEmail) && (
              <button
                onClick={() => {
                  setBuscaNome('')
                  setBuscaCpf('')
                  setBuscaEmail('')
                }}
                className="text-teal-700 hover:text-teal-900 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Contatos */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">Nenhum contato encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {buscaNome || buscaCpf || buscaEmail
                ? 'Nenhum contato correspondeu aos filtros aplicados.'
                : 'Ainda não há clientes cadastrados no AdvBox.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map((c) => (
              <div
                key={c.id}
                onClick={() => abrirCliente(c.id)}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-semibold text-xs shrink-0">
                        {(c.name || 'C')[0].toUpperCase()}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 truncate max-w-[180px]">
                        {c.name}
                      </h4>
                    </div>
                    {c.origin && (
                      <Badge variant="outline" className="text-[10px] text-slate-500 py-0">
                        {c.origin}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    {c.identification && (
                      <p className="font-mono text-[11px] text-slate-700">
                        {formatarCPFouCNPJ(c.identification)}
                      </p>
                    )}
                    {(c.cellphone || c.phone) && (
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {formatarTelefone(c.cellphone || c.phone)}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1.5 text-slate-600 truncate">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {c.email}
                      </p>
                    )}
                    {(c.city || c.state) && (
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {[c.city, c.state].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {Array.isArray(c.lawsuits) && c.lawsuits.length > 0
                      ? `${c.lawsuits.length} processo(s)`
                      : 'Sem processos'}
                  </span>
                  <span className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center">
                    Ver ficha <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalhe do Cliente */}
        <Dialog open={!!clienteSelecionadoId} onOpenChange={(open) => !open && fecharModal()}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                  AdvBox Contato #{clienteSelecionadoId}
                </span>
                {detalheCliente?.origin && (
                  <Badge variant="outline" className="text-slate-600 text-[11px]">
                    Origem: {detalheCliente.origin}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 mt-1">
                {detalheCliente?.name || 'Ficha do Cliente'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {detalheCliente?.occupation || 'Profissão não informada'}
              </DialogDescription>
            </DialogHeader>

            {carregandoDetalhe ? (
              <div className="py-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : detalheCliente ? (
              <div className="space-y-4 pt-2 text-xs">
                {/* Dados Pessoais */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    Identificação & Contato
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">CPF/CNPJ: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.identification
                          ? formatarCPFouCNPJ(detalheCliente.identification)
                          : 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Documento / RG: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.document || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Celular: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.cellphone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Telefone: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.phone || '—'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">E-mail: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Data de Nascimento: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.birthdate ? formatarData(detalheCliente.birthdate) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Estado Civil: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.civil_status || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    Endereço
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Logradouro: </span>
                      <span className="font-medium text-slate-900">
                        {[detalheCliente.street, detalheCliente.region]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Cidade / UF: </span>
                      <span className="font-medium text-slate-900">
                        {[detalheCliente.city, detalheCliente.state].filter(Boolean).join(' - ') ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">CEP: </span>
                      <span className="font-medium text-slate-900">
                        {detalheCliente.postalcode || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Processos Vinculados no AdvBox */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    Processos Associados no AdvBox
                  </p>
                  {Array.isArray(detalheCliente.lawsuits) && detalheCliente.lawsuits.length > 0 ? (
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      {detalheCliente.lawsuits.map((l: any) => (
                        <div
                          key={l.lawsuit_id}
                          className="pt-1.5 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-900">
                            {l.process_number || l.protocol_number || `Processo #${l.lawsuit_id}`}
                          </span>
                          <a
                            href={`/advbox/processos?id=${l.lawsuit_id}`}
                            className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"
                          >
                            Ver processo <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">
                      Nenhum processo vinculado a este contato no AdvBox.
                    </p>
                  )}
                </div>

                {/* Notas / Observações */}
                {detalheCliente.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                      Anotações
                    </p>
                    <p className="text-slate-700 whitespace-pre-wrap">{detalheCliente.notes}</p>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
