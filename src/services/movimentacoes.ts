import pb from '@/lib/pocketbase/client'
import type { Movimentacao } from '@/types/juridico'

export async function listarMovimentacoesProcesso(processoId: string): Promise<Movimentacao[]> {
  return await pb.collection('movimentacoes').getFullList<Movimentacao>({
    filter: `processo = "${processoId}"`,
    sort: '-data,-created',
    expand: 'registrado_por',
  })
}

export async function listarTodasMovimentacoes(limit = 20): Promise<Movimentacao[]> {
  const result = await pb.collection('movimentacoes').getList<Movimentacao>(1, limit, {
    sort: '-data,-created',
    expand: 'processo,processo.cliente,registrado_por',
  })
  return result.items
}

export async function listarPrazosProximos(): Promise<Movimentacao[]> {
  return await pb.collection('movimentacoes').getFullList<Movimentacao>({
    filter: 'prazo_fatal != "" && cumprido != true',
    sort: 'prazo_fatal',
    expand: 'processo,processo.cliente',
  })
}

export async function criarMovimentacao(dados: Partial<Movimentacao>): Promise<Movimentacao> {
  const user = pb.authStore.record
  const payload = {
    ...dados,
    registrado_por: dados.registrado_por || user?.id,
  }
  return await pb.collection('movimentacoes').create<Movimentacao>(payload)
}

export async function alternarCumpridoMovimentacao(
  id: string,
  cumprido: boolean,
): Promise<Movimentacao> {
  return await pb.collection('movimentacoes').update<Movimentacao>(id, { cumprido })
}

export async function excluirMovimentacao(id: string): Promise<boolean> {
  return await pb.collection('movimentacoes').delete(id)
}
