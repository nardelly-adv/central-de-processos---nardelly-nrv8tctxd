import pb from '@/lib/pocketbase/client'
import type { Processo } from '@/types/juridico'

export interface FiltrosProcesso {
  busca?: string
  area?: string
  status?: string
  clienteId?: string
}

export async function listarProcessos(filtros?: FiltrosProcesso): Promise<Processo[]> {
  const parts: string[] = []

  if (filtros?.clienteId) {
    parts.push(`cliente = "${filtros.clienteId}"`)
  }
  if (filtros?.status && filtros.status !== 'todos') {
    parts.push(`status = "${filtros.status}"`)
  }
  if (filtros?.area && filtros.area !== 'todas') {
    parts.push(`area = "${filtros.area}"`)
  }
  if (filtros?.busca && filtros.busca.trim()) {
    const q = filtros.busca.trim()
    parts.push(
      `(numero_cnj ~ "${q}" || titulo ~ "${q}" || parte_contraria ~ "${q}" || vara ~ "${q}" || comarca ~ "${q}")`,
    )
  }

  const filter = parts.length > 0 ? parts.join(' && ') : undefined

  return await pb.collection('processos').getFullList<Processo>({
    sort: '-created',
    filter,
    expand: 'cliente,responsavel',
  })
}

export async function obterProcesso(id: string): Promise<Processo> {
  return await pb.collection('processos').getOne<Processo>(id, {
    expand: 'cliente,responsavel',
  })
}

export async function criarProcesso(dados: Partial<Processo>): Promise<Processo> {
  return await pb.collection('processos').create<Processo>(dados)
}

export async function atualizarProcesso(id: string, dados: Partial<Processo>): Promise<Processo> {
  return await pb.collection('processos').update<Processo>(id, dados)
}

export async function excluirProcesso(id: string): Promise<boolean> {
  return await pb.collection('processos').delete(id)
}
