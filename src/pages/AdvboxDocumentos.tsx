import { useState, useCallback } from 'react'
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvboxNavHeader } from '@/components/AdvboxNavHeader'
import { AdvboxErrorBanner } from '@/components/AdvboxErrorBanner'
import { listarDocumentosAdvbox, obterDownloadDocumentoAdvbox } from '@/services/advbox'
import { formatarData } from '@/lib/formatadores'
import { useToast } from '@/hooks/use-toast'

export default function AdvboxDocumentos() {
  const { toast } = useToast()

  const [carregando, setCarregando] = useState(false)
  const [baixandoId, setBaixandoId] = useState<number | string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erroStatus, setErroStatus] = useState<number | undefined>(undefined)

  const [documentos, setDocumentos] = useState<any[]>([])
  const [jaBuscou, setJaBuscou] = useState(false)

  // Filtros (a API AdvBox exige ao menos um: name (min 3 chars), customer_id, transaction_id ou post_id)
  const [tipoFiltro, setTipoFiltro] = useState<
    'name' | 'customer_id' | 'post_id' | 'transaction_id'
  >('name')
  const [valorFiltro, setValorFiltro] = useState('')

  const buscarDocumentos = useCallback(async () => {
    if (!valorFiltro.trim()) {
      toast({
        title: 'Informe um filtro',
        description:
          'A API AdvBox exige ao menos um filtro para listar documentos (ex: nome com 3+ letras ou ID do cliente).',
        variant: 'destructive',
      })
      return
    }

    if (tipoFiltro === 'name' && valorFiltro.trim().length < 3) {
      toast({
        title: 'Nome muito curto',
        description: 'A busca por nome de documento no AdvBox exige pelo menos 3 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setCarregando(true)
    setErro(null)
    setJaBuscou(true)

    try {
      const query: Record<string, string | number> = { limit: 100 }
      query[tipoFiltro] = valorFiltro.trim()

      const res = await listarDocumentosAdvbox(query)
      if (res.error) {
        setErro(res.error)
        setErroStatus(res.upstreamStatus || 500)
      } else if (res.data) {
        const list = (res.data as any).data || []
        setDocumentos(Array.isArray(list) ? list : [])
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao consultar documentos no AdvBox.')
      setErroStatus(err?.status || 500)
    } finally {
      setCarregando(false)
    }
  }, [tipoFiltro, valorFiltro, toast])

  const baixarDocumento = async (id: number | string, nomeArquivo: string) => {
    setBaixandoId(id)
    try {
      const res = await obterDownloadDocumentoAdvbox(id)
      const data = res.data as any

      // AdvBox retorna { download_url: "..." } ou { url: "..." } no S3
      const url =
        data?.download_url || data?.url || data?.link || (typeof data === 'string' ? data : null)
      if (url) {
        // Abrir URL pré-assinada do S3 em nova aba para download direto
        window.open(url, '_blank', 'noopener,noreferrer')
        toast({
          title: 'Download iniciado',
          description: `Baixando ${nomeArquivo}. O link é válido por 5 minutos.`,
        })
      } else {
        toast({
          title: 'URL não gerada',
          description: 'A API AdvBox não retornou link de download para este documento.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Falha no download',
        description: e?.message || 'Não foi possível gerar a URL temporária de download.',
        variant: 'destructive',
      })
    } finally {
      setBaixandoId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdvboxNavHeader
        titulo="Documentos & Anexos AdvBox"
        descricao="Consulte arquivos anexados a processos, tarefas e clientes no AdvBox e gere links seguros de download (S3)."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {erro && (
          <AdvboxErrorBanner
            mensagem={erro}
            status={erroStatus}
            onTentarNovamente={buscarDocumentos}
            recarregando={carregando}
          />
        )}

        {/* Caixa de Busca com Regra da API AdvBox */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Filtro obrigatório de documentos
            </span>
            <Badge
              variant="outline"
              className="text-[10px] text-teal-800 bg-teal-50 border-teal-200"
            >
              API AdvBox v1
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="name">Por nome do arquivo (mín. 3 caracteres)</option>
                <option value="customer_id">Por ID do Cliente</option>
                <option value="post_id">Por ID da Tarefa</option>
                <option value="transaction_id">Por ID do Lançamento Financeiro</option>
              </select>
            </div>

            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={
                  tipoFiltro === 'name'
                    ? 'Ex: peticao, procuracao, contrato.pdf...'
                    : 'Digite o ID numérico correspondente...'
                }
                value={valorFiltro}
                onChange={(e) => setValorFiltro(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarDocumentos()}
                className="pl-9 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                onClick={buscarDocumentos}
                disabled={carregando}
                className="w-full h-9 bg-teal-800 hover:bg-teal-900 text-white text-xs font-medium"
              >
                {carregando ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                Buscar Anexos
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            A API da AdvBox restringe a listagem de arquivos a buscas filtradas para proteger a
            performance do armazenamento S3.
          </p>
        </div>

        {/* Lista de Documentos */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !jaBuscou ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">Consulte documentos anexados</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Informe o nome do arquivo ou o ID do cliente/tarefa acima para consultar e baixar
              anexos da nuvem AdvBox.
            </p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Nenhum documento encontrado</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Nenhum arquivo anexado correspondeu aos termos pesquisados no AdvBox.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-400 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">
                        {doc.name || `Documento #${doc.id}`}
                      </h4>
                      {doc.size && (
                        <Badge variant="outline" className="text-[10px] text-slate-500 py-0">
                          {doc.size}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      {doc.attached_to && (
                        <span>
                          Vínculo: {doc.attached_to.type || 'registro'} #{doc.attached_to.id}
                          {doc.attached_to.label ? ` (${doc.attached_to.label})` : ''}
                        </span>
                      )}
                      {doc.uploaded_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatarData(doc.uploaded_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    onClick={() => baixarDocumento(doc.id, doc.name || 'documento')}
                    disabled={baixandoId === doc.id}
                    size="sm"
                    className="bg-teal-800 hover:bg-teal-900 text-white text-xs h-8"
                  >
                    {baixandoId === doc.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Baixar (S3)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
