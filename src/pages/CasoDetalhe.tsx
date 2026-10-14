import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ESTADOS = [
  ['solicitada', 'Solicitada'],
  ['recebida', 'Recebida'],
  ['em_conferencia', 'Em conferência'],
  ['validada', 'Validada'],
  ['devolvida', 'Devolvida'],
  ['pendente', 'Pendente'],
]

const CasoDetalhe = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caso, setCaso] = useState<any>(null)
  const [pendencias, setPendencias] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [acao, setAcao] = useState<Record<string, string>>({})
  const [excecao, setExcecao] = useState('')

  const carregar = useCallback(async () => {
    if (!id) return
    setErro('')
    try {
      setCaso(await pb.collection('casos').getOne(id))
      const lista = await pb
        .collection('pendencias')
        .getList(1, 100, { filter: pb.filter('caso = {:caso}', { caso: id }), sort: '-created' })
      setPendencias(lista.items)
    } catch (e: any) {
      if ([401, 403, 404].includes(e?.status)) {
        pb.authStore.clear()
        navigate('/entrar', { replace: true })
      } else setErro(e?.response?.message || 'Falha ao carregar o caso.')
    } finally {
      setCarregando(false)
    }
  }, [id, navigate])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const atualizarPendencia = async (p: any) => {
    const dados = acao[p.id] || {}
    setErro('')
    try {
      await pb.collection('pendencias').update(p.id, {
        estado_documental: dados.estado_documental || p.estado_documental,
        motivo_devolucao: dados.motivo_devolucao || '',
        orientacao: dados.orientacao || '',
        status: dados.estado_documental === 'validada' ? 'resolvida' : 'aberta',
      })
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.message || 'Não foi possível movimentar a pendência.')
    }
  }

  const protocolar = async (p: any) => {
    const dados = acao[p.id] || {}
    if (!dados.numero) {
      setErro('Informe o número do protocolo.')
      return
    }
    try {
      await pb
        .collection('protocolos')
        .create({
          caso: id,
          pendencia: p.id,
          numero: dados.numero,
          recebido_em: new Date().toISOString(),
          recebido_por: pb.authStore.record?.id,
          ciencia_responsavel: dados.ciencia || '',
        })
      await atualizarPendencia({ ...p, estado_documental: 'recebida' })
    } catch (e: any) {
      setErro(e?.response?.message || 'Não foi possível criar o protocolo.')
    }
  }

  const avancar = async () => {
    if (!id) return
    try {
      await pb
        .collection('casos')
        .update(id, { estado_operacional: 'pronto_triagem', excecao_justificativa: excecao })
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.message || 'Avanço bloqueado: há pendências obrigatórias.')
    }
  }

  const set = (pid: string, campo: string, valor: string) =>
    setAcao((a) => ({ ...a, [pid]: { ...(a[pid] || {}), [campo]: valor } }))
  const rotulos: Record<string, string> = {
    data_atendimento: 'Data do atendimento',
    canal: 'Canal',
    atendente: 'Atendente',
    indicacao: 'Indicação',
    nome_atendido: 'Pessoa atendida',
    cpf_atendido: 'CPF da pessoa atendida',
    familia_beneficio: 'Família do benefício',
    tipo_beneficio: 'Tipo do benefício',
    nome_titular: 'Titular',
    cpf_titular: 'CPF do titular',
    nascimento_titular: 'Nascimento do titular',
    telefone_titular: 'Telefone do titular',
    endereco_titular: 'Endereço do titular',
    escolaridade: 'Escolaridade',
    profissao: 'Profissão',
    parente_ja_atendido: 'Parente já atendeu?',
    contrato_assinado: 'Contrato assinado?',
    rural_dados: 'Bloco rural',
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{caso?.titulo || 'Caso'}</h1>
            <p className="text-sm text-muted-foreground">
              Checklist, documentos e histórico do caso
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
        {erro && (
          <p role="alert" className="text-sm text-red-700">
            {erro}
          </p>
        )}
        {carregando && <p role="status">Carregando caso…</p>}
        {caso && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da ficha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {Object.entries(caso)
                  .filter(([c, v]) => rotulos[c] && v !== null && v !== '')
                  .map(([c, v]) => (
                    <p key={c} className="text-sm">
                      <b>{rotulos[c]}:</b> {String(v)}
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pendências documentais ({pendencias.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {pendencias.length === 0 ? (
              <p>Nenhuma pendência registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Operação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendencias.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="align-top">
                        <p>{p.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.obrigatoria ? 'Obrigatória' : 'Opcional'} ·{' '}
                          {p.item_chave || 'item legado'}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        {ESTADOS.find(([v]) => v === p.estado_documental)?.[1] ||
                          p.estado_documental ||
                          p.status}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[260px] space-y-2">
                          <Label htmlFor={'estado-' + p.id}>Novo estado</Label>
                          <select
                            id={'estado-' + p.id}
                            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={
                              acao[p.id]?.estado_documental || p.estado_documental || 'solicitada'
                            }
                            onChange={(e) => set(p.id, 'estado_documental', e.target.value)}
                          >
                            {ESTADOS.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          {acao[p.id]?.estado_documental === 'devolvida' && (
                            <>
                              <Input
                                placeholder="Motivo da devolução"
                                value={acao[p.id]?.motivo_devolucao || ''}
                                onChange={(e) => set(p.id, 'motivo_devolucao', e.target.value)}
                              />
                              <Textarea
                                placeholder="Orientação para reenvio"
                                value={acao[p.id]?.orientacao || ''}
                                onChange={(e) => set(p.id, 'orientacao', e.target.value)}
                              />
                            </>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void atualizarPendencia(p)}>
                              Salvar estado
                            </Button>
                            <Input
                              placeholder="Nº protocolo"
                              value={acao[p.id]?.numero || ''}
                              onChange={(e) => set(p.id, 'numero', e.target.value)}
                            />
                            <Button size="sm" variant="outline" onClick={() => void protocolar(p)}>
                              Protocolar
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avanço para pronto para triagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O sistema bloqueia o avanço enquanto houver documento obrigatório não validado. O
              advogado responsável pode registrar uma exceção justificada, que ficará auditada.
            </p>
            <Textarea
              placeholder="Justificativa da exceção jurídica (somente advogado responsável)"
              value={excecao}
              onChange={(e) => setExcecao(e.target.value)}
            />
            <Button onClick={() => void avancar()}>Tentar avançar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default CasoDetalhe
