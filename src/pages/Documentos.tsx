import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  Briefcase,
  User,
  Plus,
  FileCheck,
  FolderOpen,
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
import { EmptyState } from '@/components/EmptyState'
import { formatarBytes, formatarData } from '@/lib/formatadores'
import {
  listarDocumentos,
  criarDocumento,
  excluirDocumento,
  obterUrlArquivo,
} from '@/services/documentos'
import { listarClientes } from '@/services/clientes'
import { listarProcessos } from '@/services/processos'
import type { Documento, CategoriaDocumento, Cliente, Processo } from '@/types/juridico'
import { toast } from '@/hooks/use-toast'

const CATEGORIAS: CategoriaDocumento[] = [
  'Procuracao',
  'Peticao',
  'Contrato',
  'Identidade',
  'Comprovante',
  'Sentenca_Decisao',
  'Laudo_Pericia',
  'Outro',
]

export const Documentos = () => {
  const [searchParams] = useSearchParams()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroCliente, setFiltroCliente] = useState<string>(
    searchParams.get('clienteId') || 'todos',
  )
  const [carregando, setCarregando] = useState(true)

  // Upload modal
  const [modalUpload, setModalUpload] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [formNome, setFormNome] = useState('')
  const [formCategoria, setFormCategoria] = useState<CategoriaDocumento>('Peticao')
  const [formClienteId, setFormClienteId] = useState('')
  const [formProcessoId, setFormProcessoId] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formArquivo, setFormArquivo] = useState<File | null>(null)

  // Exclusão
  const [docParaExcluir, setDocParaExcluir] = useState<Documento | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [docs, clis, procs] = await Promise.all([
        listarDocumentos({
          busca,
          categoria: filtroCategoria,
          clienteId: filtroCliente !== 'todos' ? filtroCliente : undefined,
        }),
        listarClientes(),
        listarProcessos(),
      ])
      setDocumentos(docs)
      setClientes(clis)
      setProcessos(procs)
    } catch {
      toast({
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível carregar a lista de arquivos.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [busca, filtroCategoria, filtroCliente])

  const abrirModalUpload = () => {
    setFormNome('')
    setFormCategoria('Peticao')
    setFormClienteId(filtroCliente !== 'todos' ? filtroCliente : '')
    setFormProcessoId('')
    setFormDescricao('')
    setFormArquivo(null)
    setModalUpload(true)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formArquivo || !formNome.trim()) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Selecione um arquivo do seu dispositivo e defina o nome.',
        variant: 'destructive',
      })
      return
    }

    setEnviando(true)
    const formData = new FormData()
    formData.append('nome', formNome.trim())
    formData.append('categoria', formCategoria)
    formData.append('arquivo', formArquivo)
    if (formClienteId) formData.append('cliente', formClienteId)
    if (formProcessoId) formData.append('processo', formProcessoId)
    if (formDescricao.trim()) formData.append('descricao', formDescricao.trim())
    formData.append('tamanho_bytes', String(formArquivo.size))

    try {
      await criarDocumento(formData)
      toast({
        title: 'Documento salvo',
        description: `${formNome} foi adicionado à biblioteca.`,
      })
      setModalUpload(false)
      carregar()
    } catch (err: any) {
      toast({
        title: 'Falha no envio',
        description: err?.message || 'Não foi possível salvar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!docParaExcluir) return
    setExcluindo(true)
    try {
      await excluirDocumento(docParaExcluir.id)
      toast({
        title: 'Documento excluído',
        description: 'O arquivo foi removido com sucesso.',
      })
      setDocParaExcluir(null)
      carregar()
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o arquivo.',
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Biblioteca de Documentos
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {documentos.length}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Armazenamento seguro de procurações, petições, sentenças e arquivos da equipe.
          </p>
        </div>
        <Button
          onClick={abrirModalUpload}
          className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm shrink-0"
        >
          <Upload className="mr-2 h-4 w-4" />
          Enviar Documento
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou descrição do documento…"
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
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas as Categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[180px] truncate"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          >
            <option value="todos">Todos os Clientes</option>
            {clientes.map((cli) => (
              <option key={cli.id} value={cli.id}>
                {cli.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Documentos */}
      {carregando ? (
        <div className="py-16 text-center text-slate-400 text-sm">Carregando documentos…</div>
      ) : documentos.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10 text-teal-700" />}
          titulo={
            busca || filtroCategoria !== 'todas' || filtroCliente !== 'todos'
              ? 'Nenhum documento com esses filtros'
              : 'Nenhum documento na biblioteca'
          }
          descricao={
            busca || filtroCategoria !== 'todas' || filtroCliente !== 'todos'
              ? 'Tente remover os filtros ou buscar por outro termo.'
              : 'Faça o upload de contratos, procurações ou petições para organizar o acervo digital do escritório.'
          }
          acaoTexto={
            busca || filtroCategoria !== 'todas' ? 'Limpar filtros' : 'Enviar Primeiro Documento'
          }
          onAcao={
            busca || filtroCategoria !== 'todas'
              ? () => {
                  setBusca('')
                  setFiltroCategoria('todas')
                  setFiltroCliente('todos')
                }
              : abrirModalUpload
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc) => {
            const url = obterUrlArquivo(doc)
            return (
              <Card
                key={doc.id}
                className="hover:border-teal-400 transition-all hover:shadow-xs group flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 text-slate-500 hover:text-teal-700"
                          title="Visualizar / Baixar"
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDocParaExcluir(doc)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        title="Excluir documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.categoria ? doc.categoria.replace('_', ' ') : 'Geral'}
                    </span>
                    <h3
                      className="text-sm font-semibold text-slate-900 mt-1.5 leading-snug line-clamp-2"
                      title={doc.nome}
                    >
                      {doc.nome}
                    </h3>
                    {doc.descricao && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.descricao}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {doc.expand?.cliente && (
                      <Link
                        to={`/clientes/${doc.expand.cliente.id}`}
                        className="text-teal-700 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.expand.cliente.nome}</span>
                      </Link>
                    )}
                    {doc.expand?.processo && (
                      <Link
                        to={`/processos/${doc.expand.processo.id}`}
                        className="text-slate-600 hover:text-teal-700 flex items-center gap-1.5 truncate"
                      >
                        <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.expand.processo.numero_cnj}</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{formatarBytes(doc.tamanho_bytes)}</span>
                  <span>{formatarData(doc.created)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Upload */}
      <Dialog open={modalUpload} onOpenChange={setModalUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento para a Central</DialogTitle>
            <DialogDescription>
              Faça o upload do documento e vincule opcionalmente a um cliente ou processo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc_arq">Arquivo (PDF, DOCX, Imagem) *</Label>
              <Input
                id="doc_arq"
                type="file"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFormArquivo(f)
                    if (!formNome) {
                      setFormNome(f.name.replace(/\.[^/.]+$/, ''))
                    }
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_nm">Nome do Documento *</Label>
              <Input
                id="doc_nm"
                required
                placeholder="Ex: Procuração Ad Judicia, Sentença TJSP"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_ct">Categoria</Label>
              <select
                id="doc_ct"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value as CategoriaDocumento)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_cli">Vincular a Cliente (Opcional)</Label>
              <select
                id="doc_cli"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formClienteId}
                onChange={(e) => setFormClienteId(e.target.value)}
              >
                <option value="">Nenhum (Documento geral)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_proc">Vincular a Processo (Opcional)</Label>
              <select
                id="doc_proc"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formProcessoId}
                onChange={(e) => setFormProcessoId(e.target.value)}
              >
                <option value="">Nenhum (Documento geral)</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_cnj} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc_dc">Descrição / Observações</Label>
              <Input
                id="doc_dc"
                placeholder="Ex: Assinado digitalmente com certificado OAB"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalUpload(false)}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white"
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : 'Salvar Documento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação exclusão */}
      <AlertDialog
        open={!!docParaExcluir}
        onOpenChange={(aberto) => !aberto && setDocParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{docParaExcluir?.nome}</strong> da biblioteca? O arquivo não
              estará mais disponível para download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Documentos
