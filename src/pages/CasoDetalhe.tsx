import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const CasoDetalhe = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caso, setCaso] = useState<any>(null)
  const [pendencias, setPendencias] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!id) return
    setErro('')
    try {
      const registro = await pb.collection('casos').getOne(id)
      setCaso(registro)
      const lista = await pb.collection('pendencias').getList(1, 100, {
        filter: pb.filter('caso = {:caso}', { caso: id }),
        sort: '-created',
      })
      setPendencias(lista.items)
    } catch (e: any) {
      if (e?.status === 404 || e?.status === 403 || e?.status === 401) {
        pb.authStore.clear()
        navigate('/entrar', { replace: true })
      } else {
        setErro(e?.response?.message || 'Falha ao carregar o caso.')
      }
    } finally {
      setCarregando(false)
    }
  }, [id, navigate])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const rotulo = (campo: string) => {
    const rotulos: Record<string, string> = {
      data_atendimento: 'Data do atendimento',
      canal: 'Canal',
      canal_detalhe: 'Detalhe do canal',
      atendente: 'Atendente',
      indicacao: 'Indicação',
      nome_atendido: 'Pessoa atendida',
      cpf_atendido: 'CPF da pessoa atendida',
      atendido_e_titular: 'É o titular?',
      vinculo_atendido: 'Vínculo com o titular',
      vinculo_outro: 'Especificação do parentesco',
      representante_especificacao: 'Especificação do representante',
      familia_beneficio: 'Família do benefício',
      tipo_beneficio: 'Tipo do benefício',
      nome_titular: 'Titular',
      cpf_titular: 'CPF do titular',
      nascimento_titular: 'Nascimento do titular',
      telefone_titular: 'Telefone do titular',
      endereco_titular: 'Endereço do titular',
      senha_meu_inss: 'Senha MEU INSS',
      filiado: 'Filiado a sindicato?',
      sindicato_nome: 'Sindicato',
      escolaridade: 'Escolaridade',
      profissao: 'Profissão',
      parente_ja_atendido: 'Parente já atendeu?',
      parente_dados: 'Dados do parente',
      contrato_assinado: 'Assinou contrato?',
      assinatura_rogo_dados: 'Assinante à rogo',
      solicitou_documentos: 'Solicitou documentos?',
      docs_data_solicitacao: 'Data da solicitação',
      docs_prazo_entrega: 'Prazo de entrega',
      loas_dados: 'Bloco LOAS',
      urbano_dados: 'Bloco urbano',
      rural_dados: 'Bloco rural',
    }
    return rotulos[campo] || campo
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{caso ? caso.titulo : 'Caso'}</h1>
            <p className="text-sm text-muted-foreground">Ficha de intake e pendências do caso</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(caso)
                  .filter(
                    ([campo, valor]) => rotulo(campo) !== campo && valor !== null && valor !== '',
                  )
                  .filter(
                    ([campo]) =>
                      ![
                        'id',
                        'collectionId',
                        'collectionName',
                        'created',
                        'updated',
                        'expand',
                        'criado_por',
                      ].includes(campo),
                  )
                  .map(([campo, valor]) => (
                    <p key={campo} className="text-sm">
                      <span className="font-medium">{rotulo(campo)}:</span> {String(valor)}
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {caso && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pendências do caso ({pendencias.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendencias.length === 0 ? (
                <p>Nenhuma pendência registrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aberta em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendencias.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.descricao}</TableCell>
                        <TableCell>{p.status === 'resolvida' ? 'Resolvida' : 'Aberta'}</TableCell>
                        <TableCell>
                          {p.created ? new Date(p.created).toLocaleString('pt-BR') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CasoDetalhe
