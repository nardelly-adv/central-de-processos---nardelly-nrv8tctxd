import pb from '@/lib/pocketbase/client'
import type { Cliente } from '@/types/juridico'

export async function listarClientes(busca?: string): Promise<Cliente[]> {
  const filter =
    busca && busca.trim()
      ? `nome ~ "${busca.trim()}" || cpf_cnpj ~ "${busca.trim()}" || email ~ "${busca.trim()}" || telefone ~ "${busca.trim()}"`
      : ''
  return await pb.collection('clientes').getFullList<Cliente>({
    sort: 'nome',
    filter: filter || undefined,
  })
}

export async function obterCliente(id: string): Promise<Cliente> {
  return await pb.collection('clientes').getOne<Cliente>(id)
}

export async function criarCliente(dados: Partial<Cliente>): Promise<Cliente> {
  return await pb.collection('clientes').create<Cliente>(dados)
}

export async function atualizarCliente(id: string, dados: Partial<Cliente>): Promise<Cliente> {
  return await pb.collection('clientes').update<Cliente>(id, dados)
}

export async function excluirCliente(id: string): Promise<boolean> {
  return await pb.collection('clientes').delete(id)
}
