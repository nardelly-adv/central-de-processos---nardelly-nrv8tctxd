import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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

const ESTADOS: Record<string, string> = {
  solicitada: 'Solicitada',
  recebida: 'Recebida',
  em_conferencia: 'Em conferência',
  validada: 'Validada',
  devolvida: 'Devolvida',
  pendente: 'Pendente',
}

const TRANSICOES: Record<string, string[]> = {
  solicitada: ['pendente'],
  recebida: ['em_conferencia', 'devolvida', 'pendente'],
  em_conferencia: ['validada', 'devolvida', 'pendente'],
  pendente: ['solicitada'],
  devolvida: [],
  validada: [],
}

const LABELS: Record<string, string> = {
  data_atendimento: 'Data do atendimento',
  canal: 'Atendimento realizado',
  atendente: 'Atendente',
  indicacao: 'Indicação',
  nome_atendido: 'Pessoa atendida',
  cpf_atendido: 'CPF da pessoa atendida',
  familia_beneficio: 'Família do benefício',
  tipo_beneficio: 'Tipo do benefício',
  nome_titular: 'Titular',
  cpf_titular: 'CPF do titular',
  nascimento_titular: 'Data de nascimento',
  telefone_titular: 'Telefone',
  endereco_titular: 'Endereço',
}

const CasoDetalhe = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const papel = String(pb.authStore.record?.papel || '')
  const [caso, setCaso] = useState<any>(null)
  const [checklist, setChecklist] = useState<any>(null)
  const [checklistItems, setChecklistItems] = useState<any[]>([])
  const [pendencias, setPendencias] = useState<any[]>([])
  const [erro, setErro] = useState(
    typeof location.state?.alert === 'string' ? location.state.alert : '',
  )
  const [carregando, setCarregando] = useState(true)
  const [acao, setAcao] = useState<Record<string, Record<string, string>>>({})
  const [justificativa, setJustificativa] = useState('')

  const carregar = useCallback(async () => {
    if (!id) return
    setErro('')
    setCarregando(true)
    try {
      const registro = await pb.collection('casos').getOne(id)
      const lista = await pb.collection('pendencias').getList(1, 100, {
        filter: pb.filter('caso = {:caso}', { caso: id }),
        sort: '-created',
      })
      setCaso(registro)
      setPendencias(lista.items)
      if (registro.checklist_atual) {
        const versao = await pb.collection('checklists').getOne(registro.checklist_atual)
        setChecklist(versao)
        try {
          const parsed = JSON.parse(versao.itens_json || '[]')
          setChecklistItems(Array.isArray(parsed) ? parsed : [])
        } catch {
          setChecklistItems([])
          setErro('A versão vinculada contém itens inválidos; confira a migração do checklist.')
        }
      } else {
        setChecklist(null)
        setChecklistItems([])
      }
    } catch (e: any) {
      setErro(e?.response?.message || 'Falha ao carregar o caso e suas pendências.')
      if ([401, 403, 404].includes(e?.status)) {
        pb.authStore.clear()
        navigate('/entrar', { replace: true })
      }
    } finally {
      setCarregando(false)
    }
  }, [id, navigate])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const pendenciasObrigatoriasAbertas = useMemo(
    () => pendencias.filter((p) => p.obrigatoria && p.estado_documental !== 'validada'),
    [pendencias],
  )

  const setCampo = (pid: string, campo: string, valor: string) => {
    setAcao((a) => ({ ...a, [pid]: { ...(a[pid] || {}), [campo]: valor } }))
  }

  const instanciarChecklist = async () => {
    if (!id) return
    setErro('')
    try {
      await pb.send(`/backend/v1/casos/${id}/instanciar-checklist`, { method: 'POST' })
      await carregar()
    } catch (e: any) {
      setErro(
        e?.response?.message ||
          'Não foi possível vincular o checklist; nenhum item foi confirmado.',
      )
    }
  }

  const transicionar = async (p: any) => {
    setErro('')
    const dados = acao[p.id] || {}
    if (!dados.estado_documental || dados.estado_documental === p.estado_documental) {
      setErro('Selecione um novo estado documental.')
      return
    }
    if (dados.estado_documental === 'devolvida') {
      if (!dados.motivo_devolucao?.trim()) {
        setErro('Informe o motivo da devolução.')
        return
      }
      if (!p.orientacao_aprovada_por || !p.orientacao?.trim()) {
        setErro('A devolução exige orientação previamente aprovada pelo advogado responsável.')
        return
      }
    }
    try {
      await pb.send(`/backend/v1/pendencias/${p.id}/transicionar`, {
        method: 'POST',
        body: JSON.stringify({
          estado: dados.estado_documental,
          motivo_devolucao: dados.motivo_devolucao || '',
        }),
      })
      setAcao((a) => ({ ...a, [p.id]: {} }))
      await carregar()
    } catch (e: any) {
      setErro(
        e?.response?.message ||
          'A transição foi recusada; confira o estado atual antes de repetir.',
      )
      await carregar()
    }
  }

  const aprovarOrientacao = async (p: any) => {
    const orientacao = (acao[p.id]?.orientacao_aprovada || '').trim()
    if (!orientacao) {
      setErro('Escreva a orientação de reenvio a aprovar.')
      return
    }
    setErro('')
    try {
      await pb.send(`/backend/v1/pendencias/${p.id}/aprovar-orientacao`, {
        method: 'POST',
        body: JSON.stringify({ orientacao }),
      })
      setAcao((a) => ({ ...a, [p.id]: {} }))
      await carregar()
    } catch (e: any) {
      setErro(
        e?.response?.message || 'A orientação não foi aprovada; nenhuma alteração foi confirmada.',
      )
    }
  }

  const protocolar = async (p: any) => {
    setErro('')
    const dados = acao[p.id] || {}
    if (!dados.numero?.trim()) {
      setErro('Informe o número do protocolo.')
      return
    }
    if (!dados.ciencia?.trim()) {
      setErro('Registre a ciência do responsável pelo caso.')
      return
    }
    try {
      await pb.send(`/backend/v1/pendencias/${p.id}/protocolar`, {
        method: 'POST',
        body: JSON.stringify({
          numero: dados.numero.trim(),
          ciencia_responsavel: dados.ciencia.trim(),
        }),
      })
      setAcao((a) => ({ ...a, [p.id]: {} }))
      await carregar()
    } catch (e: any) {
      setErro(
        e?.response?.message || 'Protocolo recusado; confira o estado antes de tentar novamente.',
      )
      await carregar()
    }
  }

  const encaminhar = async () => {
    if (!id) return
    setErro('')
    try {
      await pb.send(`/backend/v1/casos/${id}/encaminhar-triagem`, {
        method: 'POST',
        body: JSON.stringify({ justificativa }),
      })
      await carregar()
    } catch (e: any) {
      setErro(e?.response?.message || 'O caso não foi encaminhado; a operação foi recusada.')
      await carregar()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{caso?.titulo || 'Caso'}</h1>
            <p className="text-sm text-muted-foreground">
              Ficha de atendimento, documentos e histórico do caso
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
        {erro && (
          <p role="alert" aria-live="assertive" className="text-sm text-red-700">
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
                  .filter(([campo, valor]) => LABELS[campo] && valor !== null && valor !== '')
                  .map(([campo, valor]) => (
                    <p key={campo} className="text-sm">
                      <b>{LABELS[campo]}:</b> {String(valor)}
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {caso && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist documental</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Versão {checklist.versao} ·{' '}
                    {checklist.status_aprovacao === 'aprovado'
                      ? 'Aprovada pelo jurídico'
                      : 'PENDENTE DE APROVAÇÃO JURÍDICA'}
                  </p>
                  {checklist.status_aprovacao !== 'aprovado' && (
                    <p className="text-amber-800">
                      Itens meramente demonstrativos e opcionais; não representam obrigação
                      jurídica.
                    </p>
                  )}
                  {checklistItems.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5">
                      {checklistItems.map((item) => (
                        <li key={item.chave}>
                          {item.nome} —{' '}
                          {checklist.status_aprovacao === 'aprovado' && item.obrigatoria
                            ? 'obrigatório aprovado'
                            : 'opcional'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-sm">
                  Nenhum checklist vinculado. Se o tipo rural estiver no recorte demonstrativo, a
                  equipe pode instanciar o plano sintético opcional.
                </p>
              )}
              {['atendimento', 'cadastro'].includes(papel) &&
                caso.familia_beneficio === 'rural' &&
                !checklist && (
                  <Button
                    variant="outline"
                    disabled={carregando}
                    onClick={() => void instanciarChecklist()}
                  >
                    Instanciar plano sintético opcional
                  </Button>
                )}
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
                  {pendencias.map((p) => {
                    const opcoes = TRANSICOES[p.estado_documental] || []
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="align-top">
                          <p>{p.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.obrigatoria
                              ? 'Obrigatória · checklist aprovado'
                              : 'Exemplo opcional / não obrigatório'}
                            {p.item_chave ? ` · ${p.item_chave}` : ''}
                          </p>
                          {p.motivo_devolucao && (
                            <p className="text-xs">Motivo: {p.motivo_devolucao}</p>
                          )}
                          {p.orientacao && (
                            <p className="text-xs">Orientação aprovada: {p.orientacao}</p>
                          )}{' '}
                        </TableCell>
                        <TableCell className="align-top">
                          {ESTADOS[p.estado_documental] || p.estado_documental || p.status}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[260px] space-y-2">
                            {papel === 'advogado_responsavel' &&
                              ['recebida', 'em_conferencia'].includes(p.estado_documental) && (
                                <>
                                  <p className="text-xs">
                                    {p.orientacao_aprovada_por
                                      ? `Orientação aprovada: ${p.orientacao}`
                                      : 'A devolução exige orientação aprovada pelo advogado responsável.'}
                                  </p>
                                  {!p.orientacao_aprovada_por && (
                                    <>
                                      <Textarea
                                        aria-label="Orientação para aprovação"
                                        placeholder="Escreva a orientação de reenvio"
                                        value={acao[p.id]?.orientacao_aprovada || ''}
                                        onChange={(ev) =>
                                          setCampo(p.id, 'orientacao_aprovada', ev.target.value)
                                        }
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void aprovarOrientacao(p)}
                                      >
                                        Aprovar orientação de devolução
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                            {papel === 'operacao_documental' && opcoes.length > 0 && (
                              <>
                                <Label htmlFor={`estado-${p.id}`}>Próximo estado</Label>
                                <select
                                  id={`estado-${p.id}`}
                                  className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={acao[p.id]?.estado_documental || ''}
                                  onChange={(ev) =>
                                    setCampo(p.id, 'estado_documental', ev.target.value)
                                  }
                                >
                                  <option value="">Selecione…</option>
                                  {opcoes
                                    .filter(
                                      (estado) =>
                                        estado !== 'devolvida' || !!p.orientacao_aprovada_por,
                                    )
                                    .map((estado) => (
                                      <option key={estado} value={estado}>
                                        {ESTADOS[estado]}
                                      </option>
                                    ))}
                                </select>
                                {acao[p.id]?.estado_documental === 'devolvida' && (
                                  <Input
                                    aria-label="Motivo da devolução"
                                    placeholder="Motivo da devolução"
                                    value={acao[p.id]?.motivo_devolucao || ''}
                                    onChange={(ev) =>
                                      setCampo(p.id, 'motivo_devolucao', ev.target.value)
                                    }
                                  />
                                )}
                                <Button size="sm" onClick={() => void transicionar(p)}>
                                  Salvar transição
                                </Button>
                              </>
                            )}
                            {papel === 'operacao_documental' &&
                              p.estado_documental === 'solicitada' && (
                                <>
                                  <Input
                                    aria-label="Número do protocolo"
                                    placeholder="Nº protocolo"
                                    value={acao[p.id]?.numero || ''}
                                    onChange={(ev) => setCampo(p.id, 'numero', ev.target.value)}
                                  />
                                  <Input
                                    aria-label="Ciência do responsável"
                                    placeholder="Ciência do responsável"
                                    value={acao[p.id]?.ciencia || ''}
                                    onChange={(ev) => setCampo(p.id, 'ciencia', ev.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void protocolar(p)}
                                  >
                                    Registrar recebimento e protocolo
                                  </Button>
                                </>
                              )}
                            {!['operacao_documental'].includes(papel) && (
                              <p className="text-xs text-muted-foreground">
                                Somente operação documental pode movimentar este item.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situação e encaminhamento para triagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O sistema bloqueia o encaminhamento se faltar requisito de checklist aprovado. Exceção
              exige advogado responsável, justificativa e trilha auditada. Itens do plano B
              pendentes não contam como obrigatórios.
            </p>
            {papel === 'advogado_responsavel' && pendenciasObrigatoriasAbertas.length > 0 && (
              <Textarea
                aria-label="Justificativa da exceção documental"
                placeholder="Justificativa da exceção documental"
                value={justificativa}
                onChange={(ev) => setJustificativa(ev.target.value)}
              />
            )}
            {papel === 'advogado_responsavel' && (
              <Button onClick={() => void encaminhar()}>Marcar como pronto para triagem</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CasoDetalhe
