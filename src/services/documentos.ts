import pb from '@/lib/pocketbase/client'
import type { Documento } from '@/types/juridico'

export interface FiltrosDocumento {
  clienteId?: string
  processoId?: string
  categoria?: string
  busca?: string
}

export async function listarDocumentos(filtros?: FiltrosDocumento): Promise<Documento[]> {
  const parts: string[] = []

  if (filtros?.clienteId) parts.push(`cliente = "${filtros.clienteId}"`)
  if (filtros?.processoId) parts.push(`processo = "${filtros.processoId}"`)
  if (filtros?.categoria && filtros.categoria !== 'todas')
    parts.push(`categoria = "${filtros.categoria}"`)
  if (filtros?.busca && filtros.busca.trim()) {
    const q = filtros.busca.trim()
    parts.push(`(nome ~ "${q}" || descricao ~ "${q}")`)
  }

  const filter = parts.length > 0 ? parts.join(' && ') : undefined

  return await pb.collection('documentos').getFullList<Documento>({
    sort: '-created',
    filter,
    expand: 'cliente,processo,enviado_por',
  })
}

export async function criarDocumento(formData: FormData): Promise<Documento> {
  const user = pb.authStore.record
  if (user?.id && !formData.has('enviado_por')) {
    formData.append('enviado_por', user.id)
  }
  return await pb.collection('documentos').create<Documento>(formData)
}

export async function excluirDocumento(id: string): Promise<boolean> {
  return await pb.collection('documentos').delete(id)
}

export function obterUrlArquivo(doc: Documento): string {
  if (!doc.arquivo) return ''
  return pb.files.getURL(doc, doc.arquivo)
}
