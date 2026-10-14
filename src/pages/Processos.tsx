import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { toast } from '@/hooks/use-toast'
import { StatusBadge, AreaBadge, PrioridadeBadge } from '@/components/StatusBadges'
import { EmptyState } from '@/components/EmptyState'
import { formatarCNJ, formatarData, formatarMoeda } from '@/lib/formatadores'
import {
  listarProcessos,
  criarProcesso,
  atualizarProcesso,
  excluirProcesso,
} from '@/services/processos'
import { listarClientes } from '@/services/clientes'
import type {
  Processo,
  Cliente,
  AreaDireito,
  StatusProcesso,
  PrioridadeProcesso,
} from '@/types/juridico'

const AREAS: AreaDireito[] = [
  'Civel',
  'Trabalhista',
  'Criminal',
  'Familia',
  'Previdenciario',
  'Tributario',
  'Consumidor',
  'Outra',
]

const STATUS_OPCOES: StatusProcesso[] = ['Ativo', 'Suspenso', 'Arquivado', 'Encerrado']

export const Processos = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [filtroArea, setFiltroArea] = useState<string>('todas')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [carregando, setCarregando] = useState(true)

  // Modal formulário
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [processoEditando, setProcessoEditando] = useState<Processo | null>(null)

  // Campos do formulário
  const [formCnj, setFormCnj] = useState('')
  const [formTitulo, setFormTitulo] = useState('')
  const [formClienteId, setFormClienteId] = useState('')
  const [formParteContraria, setFormParteContraria] = useState('')
  const [formArea, setFormArea] = useState<AreaDireito>('Civel')
  const [formStatus, setFormStatus] = useState<StatusProcesso>('Ativo')
  const [formFase, setFormFase] = useState('')
  const [formTribunal, setFormTribunal] = useState('')
  const [formVara, setFormVara] = useState('')
  const [formComarca, setFormComarca] = useState('')
  const [formValorCausa, setFormValorCausa] = useState<string>('')
  const [formPrioridade, setFormPrioridade] = useState<PrioridadeProcesso>('Media')
  const [formDataDistribuicao, setFormDataDistribuicao] = useState('')
  const [formProximoPrazo, setFormProximoPrazo] = useState('')
  const [formDescricaoPrazo, setFormDescricaoPrazo] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')

  // Exclusão
  const [procParaExcluir, setProcParaExcluir] = useState<Processo | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [listaP, listaC] = await Promise.all([
        listarProcessos({
          busca,
          area: filtroArea,
          status: filtroStatus,
        }),
        listarClientes(),
      ])
      setProcessos(listaP)
      setClientes(listaC)
    } catch {
      toast({
        title: 'Erro ao carregar processos',
        description: 'Não foi possível carregar a listagem.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [busca, filtroArea, filtroStatus])

  // Abrir modal automaticamente se ?novo=1
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      const cliParam = searchParams.get('clienteId')
      abrirModalNovo(cliParam || undefined)
      searchParams.delete('novo')
      searchParams.delete('clienteId')
      setSearchParams(searchParams)
    }
  }, [searchParams])

  const abrirModalNovo = (clienteIdPredefinido?: string) => {
    setProcessoEditando(null)
    setFormCnj('')
    setFormTitulo('')
    setFormClienteId(clienteIdPredefinido || clientes[0]?.id || '')
    setFormParteContraria('')
    setFormArea('Civel')
    setFormStatus('Ativo')
    setFormFase('Inicial / Distribuição')
    setFormTribunal('')
    setFormVara('')
    setFormComarca('')
    setFormValorCausa('')
    setFormPrioridade('Media')
    setFormDataDistribuicao(new Date().toISOString().split('T')[0])
    setFormProximoPrazo('')
    setFormDescricaoPrazo('')
    setFormObservacoes('')
    setModalAberto(true)
  }

  const abrirModalEditar = (p: Processo, e: React.MouseEvent) => {
    e.stopPropagation()
    setProcessoEditando(p)
    setFormCnj(p.numero_cnj || '')
    setFormTitulo(p.titulo || '')
    setFormClienteId(p.cliente || '')
    setFormParteContraria(p.parte_contraria || '')
    setFormArea(p.area || 'Civel')
    setFormStatus(p.status || 'Ativo')
    setFormFase(p.fase || '')
    setFormTribunal(p.tribunal || '')
    setFormVara(p.vara || '')
    setFormComarca(p.comarca || '')
    setFormValorCausa(p.valor_causa ? String(p.valor_causa) : '')
    setFormPrioridade(p.prioridade || 'Media')
    setFormDataDistribuicao(p.data_distribuicao ? p.data_distribuicao.split('T')[0] : '')
    setFormProximoPrazo(p.proximo_prazo ? p.proximo_prazo.split('T')[0] : '')
    setFormDescricaoPrazo(p.descricao_proximo_prazo || '')
    setFormObservacoes(p.observacoes || '')
    setModalAberto(true)
  }

  const salvarProcesso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCnj.trim() || !formTitulo.trim() || !formClienteId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Número CNJ, título do processo e cliente são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    const dados: Partial<Processo> = {
      numero_cnj: formCnj.trim(),
      titulo: formTitulo.trim(),
      cliente: formClienteId,
      parte_contraria: formParteContraria.trim() || undefined,
      area: formArea,
      status: formStatus,
      fase: formFase.trim() || undefined,
      tribunal: formTribunal.trim() || undefined,
      vara: formVara.trim() || undefined,
      comarca: formComarca.trim() || undefined,
      valor_causa: formValorCausa ? parseFloat(formValorCausa.replace(',', '.')) : undefined,
      prioridade: formPrioridade,
      data_distribuicao: formDataDistribuicao || undefined,
      proximo_prazo: formProximoPrazo || undefined,
      descricao_proximo_prazo: formDescricaoPrazo.trim() || undefined,
      observacoes: formObservacoes.trim() || undefined,
    }

    try {
      if (processoEditando) {
        await atualizarProcesso(processoEditando.id, dados)
        toast({
          title: 'Processo atualizado',
          description: `Os dados do processo foram atualizados.`,
        })
      } else {
        await criarProcesso(dados)
        toast({
          title: 'Processo cadastrado',
          description: `Novo processo autuado com sucesso.`,
        })
      }
      setModalAberto(false)
      carregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar o processo.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!procParaExcluir) return
    setExcluindo(true)
    try {
      await excluirProcesso(procParaExcluir.id)
      toast({
        title: 'Processo removido',
        description: 'O processo foi excluído com sucesso.',
      })
      setProcParaExcluir(null)
      carregar()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover este processo.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Processos</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {processos.length}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Acompanhamento de autos, prazos, audiências e movimentações do escritório.
          </p>
        </div>
        <Button
          onClick={() => abrirModalNovo()}
          className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número CNJ, título, parte contrária ou vara…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 border-slate-200"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
          >
            <option value="todas">Todas as Áreas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Processos */}
      {carregando ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando processos…</div>
      ) : processos.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-10 w-10 text-teal-700" />}
          titulo={
            busca || filtroArea !== 'todas' || filtroStatus !== 'todos'
              ? 'Nenhum processo com esses filtros'
              : 'Nenhum processo cadastrado'
          }
          descricao={
            busca || filtroArea !== 'todas' || filtroStatus !== 'todos'
              ? 'Tente ajustar os filtros ou a palavra-chave da busca.'
              : 'Cadastre o primeiro processo para gerenciar fases, prazos e documentos.'
          }
          acaoTexto={busca || filtroArea !== 'todas' ? 'Limpar filtros' : 'Cadastrar Processo'}
          onAcao={
            busca || filtroArea !== 'todas'
              ? () => {
                  setBusca('')
                  setFiltroArea('todas')
                  setFiltroStatus('todos')
                }
              : () => abrirModalNovo()
          }
        />
      ) : (
        <div className="space-y-3">
          {processos.map((p) => (
            <Card
              key={p.id}
              className="hover:border-teal-400 transition-all hover:shadow-sm group relative overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
                      {formatarCNJ(p.numero_cnj)}
                    </span>
                    <AreaBadge area={p.area} />
                    <StatusBadge status={p.status} />
                    <PrioridadeBadge prioridade={p.prioridade} />
                  </div>

                  <Link
                    to={`/processos/${p.id}`}
                    className="text-base font-semibold text-slate-900 block group-hover:text-teal-700 transition leading-snug"
                  >
                    {p.titulo}
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Cliente: {p.expand?.cliente?.nome || 'Não vinculado'}
                    </span>
                    {p.parte_contraria && (
                      <span className="text-slate-500">vs. {p.parte_contraria}</span>
                    )}
                    {(p.vara || p.comarca) && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {p.vara || p.comarca}
                      </span>
                    )}
                    {p.valor_causa !== undefined && p.valor_causa !== null && (
                      <span className="font-medium text-slate-700">
                        Valor: {formatarMoeda(p.valor_causa)}
                      </span>
                    )}
                  </div>

                  {p.proximo_prazo && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      <span>Próximo prazo: {formatarData(p.proximo_prazo)}</span>
                      {p.descricao_proximo_prazo && (
                        <span className="text-amber-700 font-normal truncate max-w-xs">
                          — {p.descricao_proximo_prazo}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => abrirModalEditar(p, e)}
                    className="h-8 w-8 text-slate-400 hover:text-teal-700"
                    title="Editar processo"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setProcParaExcluir(p)
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    title="Excluir processo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-slate-900 hover:bg-teal-700 text-white text-xs h-8"
                  >
                    <Link to={`/processos/${p.id}`}>Ver Autos &rarr;</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Processo */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{processoEditando ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
            <DialogDescription>
              Preencha os dados judiciais do processo para acompanhamento pela equipe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarProcesso} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="cnj">Número do Processo (CNJ) *</Label>
                <Input
                  id="cnj"
                  required
                  placeholder="Ex: 5001234-88.2024.8.26.0100"
                  value={formCnj}
                  onChange={(e) => setFormCnj(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="titulo">Título / Ação *</Label>
                <Input
                  id="titulo"
                  required
                  placeholder="Ex: Ação de Cobrança c/c Danos Morais"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cliente">Cliente Representado *</Label>
                <select
                  id="cliente"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formClienteId}
                  onChange={(e) => setFormClienteId(e.target.value)}
                >
                  <option value="">Selecione um cliente…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.tipo_pessoa === 'juridica' ? 'PJ' : 'PF'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parte_contraria">Parte Contrária (Réu / Autor)</Label>
                <Input
                  id="parte_contraria"
                  placeholder="Ex: Banco Alfa S/A"
                  value={formParteContraria}
                  onChange={(e) => setFormParteContraria(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area">Área do Direito</Label>
                <select
                  id="area"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value as AreaDireito)}
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status Processual</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusProcesso)}
                >
                  {STATUS_OPCOES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fase">Fase Atual / Etapa</Label>
                <Input
                  id="fase"
                  placeholder="Ex: Petição Inicial, Instrução, Execução"
                  value={formFase}
                  onChange={(e) => setFormFase(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prioridade">Prioridade</Label>
                <select
                  id="prioridade"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formPrioridade}
                  onChange={(e) => setFormPrioridade(e.target.value as PrioridadeProcesso)}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tribunal">Tribunal / Instância</Label>
                <Input
                  id="tribunal"
                  placeholder="Ex: TJSP, TRT-2, TRF-3, STJ"
                  value={formTribunal}
                  onChange={(e) => setFormTribunal(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vara">Vara</Label>
                <Input
                  id="vara"
                  placeholder="Ex: 2ª Vara Cível"
                  value={formVara}
                  onChange={(e) => setFormVara(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comarca">Comarca / Foro</Label>
                <Input
                  id="comarca"
                  placeholder="Ex: São Paulo - Central"
                  value={formComarca}
                  onChange={(e) => setFormComarca(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="valor_causa">Valor da Causa (R$)</Label>
                <Input
                  id="valor_causa"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formValorCausa}
                  onChange={(e) => setFormValorCausa(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="data_distribuicao">Data de Distribuição</Label>
                <Input
                  id="data_distribuicao"
                  type="date"
                  value={formDataDistribuicao}
                  onChange={(e) => setFormDataDistribuicao(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proximo_prazo">Próximo Prazo / Audiência</Label>
                <Input
                  id="proximo_prazo"
                  type="date"
                  value={formProximoPrazo}
                  onChange={(e) => setFormProximoPrazo(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="descricao_proximo_prazo">Descrição do Próximo Prazo</Label>
                <Input
                  id="descricao_proximo_prazo"
                  placeholder="Ex: Audiência de conciliação às 14h / Réplica à contestação"
                  value={formDescricaoPrazo}
                  onChange={(e) => setFormDescricaoPrazo(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="observacoes">Observações e Estratégia</Label>
                <textarea
                  id="observacoes"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Anotações estratégicas da equipe…"
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando…'
                  : processoEditando
                    ? 'Salvar Alterações'
                    : 'Autuar Processo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!procParaExcluir}
        onOpenChange={(aberto) => !aberto && setProcParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente remover o processo <strong>{procParaExcluir?.numero_cnj}</strong>? As
              movimentações vinculadas serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {excluindo ? 'Excluindo…' : 'Excluir Processo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Processos
