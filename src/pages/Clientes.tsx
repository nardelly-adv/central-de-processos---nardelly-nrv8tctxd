import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronRight,
  UserCheck,
  Building2,
  Trash2,
  Edit2,
  X,
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
import { EmptyState } from '@/components/EmptyState'
import { formatarCPFouCNPJ, formatarTelefone } from '@/lib/formatadores'
import { listarClientes, criarCliente, atualizarCliente, excluirCliente } from '@/services/clientes'
import type { Cliente, TipoPessoa, EstadoCivil } from '@/types/juridico'

export const Clientes = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  // Modal formulário (Criar / Editar)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)

  // Dialog confirmação de exclusão
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Campos do formulário
  const [formNome, setFormNome] = useState('')
  const [formTipoPessoa, setFormTipoPessoa] = useState<TipoPessoa>('fisica')
  const [formCpfCnpj, setFormCpfCnpj] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTelefone, setFormTelefone] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formProfissao, setFormProfissao] = useState('')
  const [formEstadoCivil, setFormEstadoCivil] = useState<EstadoCivil | ''>('')
  const [formRg, setFormRg] = useState('')
  const [formEndereco, setFormEndereco] = useState('')
  const [formCidade, setFormCidade] = useState('')
  const [formEstado, setFormEstado] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')

  const carregar = async (termoBusca?: string) => {
    setCarregando(true)
    try {
      const dados = await listarClientes(termoBusca)
      setClientes(dados)
    } catch (err) {
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível buscar a lista de clientes.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar(busca)
  }, [busca])

  // Abrir modal automaticamente se ?novo=1
  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      abrirModalNovo()
      searchParams.delete('novo')
      setSearchParams(searchParams)
    }
  }, [searchParams])

  const abrirModalNovo = () => {
    setClienteEditando(null)
    setFormNome('')
    setFormTipoPessoa('fisica')
    setFormCpfCnpj('')
    setFormEmail('')
    setFormTelefone('')
    setFormWhatsapp('')
    setFormProfissao('')
    setFormEstadoCivil('')
    setFormRg('')
    setFormEndereco('')
    setFormCidade('')
    setFormEstado('')
    setFormObservacoes('')
    setModalAberto(true)
  }

  const abrirModalEditar = (c: Cliente, e: React.MouseEvent) => {
    e.stopPropagation()
    setClienteEditando(c)
    setFormNome(c.nome || '')
    setFormTipoPessoa(c.tipo_pessoa || 'fisica')
    setFormCpfCnpj(c.cpf_cnpj || '')
    setFormEmail(c.email || '')
    setFormTelefone(c.telefone || '')
    setFormWhatsapp(c.whatsapp || '')
    setFormProfissao(c.profissao || '')
    setFormEstadoCivil(c.estado_civil || '')
    setFormRg(c.rg || '')
    setFormEndereco(c.endereco || '')
    setFormCidade(c.cidade || '')
    setFormEstado(c.estado || '')
    setFormObservacoes(c.observacoes || '')
    setModalAberto(true)
  }

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do cliente.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    const dados: Partial<Cliente> = {
      nome: formNome.trim(),
      tipo_pessoa: formTipoPessoa,
      cpf_cnpj: formCpfCnpj.trim() || undefined,
      email: formEmail.trim() || undefined,
      telefone: formTelefone.trim() || undefined,
      whatsapp: formWhatsapp.trim() || undefined,
      profissao: formProfissao.trim() || undefined,
      estado_civil: formEstadoCivil ? formEstadoCivil : undefined,
      rg: formRg.trim() || undefined,
      endereco: formEndereco.trim() || undefined,
      cidade: formCidade.trim() || undefined,
      estado: formEstado.trim().toUpperCase() || undefined,
      observacoes: formObservacoes.trim() || undefined,
    }

    try {
      if (clienteEditando) {
        await atualizarCliente(clienteEditando.id, dados)
        toast({
          title: 'Cliente atualizado',
          description: `Os dados de ${dados.nome} foram salvos com sucesso.`,
        })
      } else {
        await criarCliente(dados)
        toast({
          title: 'Cliente cadastrado',
          description: `${dados.nome} foi cadastrado com sucesso.`,
        })
      }
      setModalAberto(false)
      carregar(busca)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar os dados do cliente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!clienteParaExcluir) return
    setExcluindo(true)
    try {
      await excluirCliente(clienteParaExcluir.id)
      toast({
        title: 'Cliente excluído',
        description: `${clienteParaExcluir.nome} foi removido com sucesso.`,
      })
      setClienteParaExcluir(null)
      carregar(busca)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description:
          'Não foi possível excluir o cliente. Verifique se ele possui processos associados.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {clientes.length}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Gerencie o cadastro de pessoas físicas e jurídicas atendidas pelo escritório.
          </p>
        </div>
        <Button
          onClick={abrirModalNovo}
          className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-white border-slate-200"
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
      </div>

      {/* Conteúdo: Lista ou Vazio */}
      {carregando ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando clientes…</div>
      ) : clientes.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-teal-700" />}
          titulo={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          descricao={
            busca
              ? `Não foram encontrados registros para "${busca}". Tente outro termo.`
              : 'Comece cadastrando o primeiro cliente do seu escritório para associar processos e documentos.'
          }
          acaoTexto={busca ? 'Limpar busca' : 'Cadastrar Primeiro Cliente'}
          onAcao={busca ? () => setBusca('') : abrirModalNovo}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <Card
              key={c.id}
              className="hover:border-teal-400 transition-all hover:shadow-md group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      {c.tipo_pessoa === 'juridica' ? (
                        <Building2 className="h-5 w-5" />
                      ) : (
                        <UserCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/clientes/${c.id}`}
                        className="font-semibold text-slate-900 group-hover:text-teal-700 transition truncate block text-base"
                      >
                        {c.nome}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatarCPFouCNPJ(c.cpf_cnpj)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => abrirModalEditar(c, e)}
                      className="h-8 w-8 text-slate-400 hover:text-teal-700"
                      title="Editar cliente"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setClienteParaExcluir(c)
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                      title="Excluir cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {(c.telefone || c.whatsapp) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatarTelefone(c.whatsapp || c.telefone)}</span>
                    </div>
                  )}
                  {c.cidade && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {c.cidade} {c.estado ? `— ${c.estado}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase text-slate-500 tracking-wider">
                  {c.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
                <Link
                  to={`/clientes/${c.id}`}
                  className="text-xs font-semibold text-teal-700 group-hover:text-teal-800 flex items-center gap-1 hover:underline"
                >
                  Ver ficha completa
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Cliente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {clienteEditando
                ? `Editar Cliente: ${clienteEditando.nome}`
                : 'Cadastrar Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente. As informações ficam disponíveis para toda a equipe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarCliente} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="nome">Nome completo ou Razão Social *</Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: João da Silva / Construtora Exemplo LTDA"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                <select
                  id="tipo_pessoa"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formTipoPessoa}
                  onChange={(e) => setFormTipoPessoa(e.target.value as TipoPessoa)}
                >
                  <option value="fisica">Pessoa Física (CPF)</option>
                  <option value="juridica">Pessoa Jurídica (CNPJ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf_cnpj">{formTipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'}</Label>
                <Input
                  id="cpf_cnpj"
                  placeholder={
                    formTipoPessoa === 'juridica' ? '00.000.000/0001-00' : '000.000.000-00'
                  }
                  value={formCpfCnpj}
                  onChange={(e) => setFormCpfCnpj(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">Telefone / WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 90000-0000"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                />
              </div>

              {formTipoPessoa === 'fisica' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      placeholder="Ex: Engenheiro, Professor, Autônomo"
                      value={formProfissao}
                      onChange={(e) => setFormProfissao(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <select
                      id="estado_civil"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formEstadoCivil}
                      onChange={(e) => setFormEstadoCivil(e.target.value as EstadoCivil)}
                    >
                      <option value="">Não informado</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="uniao_estavel">União Estável</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={formCidade}
                  onChange={(e) => setFormCidade(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  maxLength={2}
                  placeholder="SP"
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="endereco">Endereço completo</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, complemento, bairro"
                  value={formEndereco}
                  onChange={(e) => setFormEndereco(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="observacoes">Observações internas</Label>
                <textarea
                  id="observacoes"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Anotações sobre preferências, histórico ou especificidades do cliente…"
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
                  : clienteEditando
                    ? 'Salvar Alterações'
                    : 'Cadastrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!clienteParaExcluir}
        onOpenChange={(aberto) => !aberto && setClienteParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o cliente <strong>{clienteParaExcluir?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {excluindo ? 'Excluindo…' : 'Excluir Definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Clientes
