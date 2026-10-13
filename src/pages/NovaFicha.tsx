import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CANAIS = [
  ['ligacao', 'Ligação telefônica'],
  ['whatsapp', 'WhatsApp'],
  ['digisac', 'Digisac'],
  ['presencial_escritorio', 'Presencial no escritório'],
  ['presencial_sindicato', 'Presencial em sindicato'],
  ['presencial_externo', 'Presencial externo'],
  ['indireto_parceiro', 'Indireto (parceiro que indicou)'],
]

const FAMILIAS = [
  ['loas', 'LOAS (benefício assistencial)'],
  ['urbano', 'Benefício urbano'],
  ['rural', 'Benefício rural'],
]

const VINCULOS = [
  ['pai_mae', 'Pai/Mãe do titular'],
  ['conjuge', 'Esposo(a)/Companheiro(a)'],
  ['outro_parentesco', 'Outro parentesco'],
  ['representante', 'Representante (tutor nato, curador, guarda)'],
]

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'

const NovaFicha = () => {
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ficha, setFicha] = useState({
    data_atendimento: '',
    canal: '',
    canal_detalhe: '',
    atendente: '',
    indicacao: '',
    nome_atendido: '',
    cpf_atendido: '',
    atendido_e_titular: 'sim',
    vinculo_atendido: '',
    vinculo_outro: '',
    representante_especificacao: '',
    familia_beneficio: '',
    tipo_beneficio: '',
    nome_titular: '',
    cpf_titular: '',
    nascimento_titular: '',
    telefone_titular: '',
    endereco_titular: '',
    senha_meu_inss: '',
    filiado: 'nao',
    sindicato_nome: '',
    escolaridade: '',
    profissao: '',
    parente_ja_atendido: 'nao',
    parente_dados: '',
    contrato_assinado: '',
    assinatura_rogo_dados: '',
    solicitou_documentos: 'nao',
    docs_data_solicitacao: '',
    docs_prazo_entrega: '',
    loas_dados: '',
    urbano_dados: '',
    rural_dados: '',
  })

  const set = (campo: string, valor: string) => setFicha((f) => ({ ...f, [campo]: valor }))

  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setErro('')
    setMsg('')
    setEnviando(true)
    try {
      const resultado = await pb.collection('casos').create({
        titulo: 'Ficha de intake — ' + (ficha.nome_atendido || 'sem nome informado'),
        descricao: ficha.tipo_beneficio,
        status: 'aberto',
        ...ficha,
      })
      setMsg('Ficha registrada. Pendências de dados faltantes foram geradas automaticamente.')
      navigate('/caso/' + resultado.id)
    } catch (e: any) {
      setErro(e?.response?.message || 'Falha ao registrar a ficha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Nova ficha de intake</h1>
            <p className="text-sm text-muted-foreground">
              Campos obrigatórios faltantes viram pendências explícitas do caso — nada se perde.
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
        {msg && (
          <p role="status" className="text-sm text-green-700">
            {msg}
          </p>
        )}

        <form onSubmit={salvar} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_atendimento">Data do atendimento</Label>
                <Input
                  id="data_atendimento"
                  type="date"
                  value={ficha.data_atendimento}
                  onChange={(e) => set('data_atendimento', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <select
                  id="canal"
                  className={selectClass}
                  value={ficha.canal}
                  onChange={(e) => set('canal', e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {CANAIS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              {['presencial_sindicato', 'presencial_externo', 'indireto_parceiro'].includes(
                ficha.canal,
              ) && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="canal_detalhe">
                    Detalhe do canal (sindicato, local ou parceiro)
                  </Label>
                  <Input
                    id="canal_detalhe"
                    value={ficha.canal_detalhe}
                    onChange={(e) => set('canal_detalhe', e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="atendente">Atendente (quem preencheu)</Label>
                <Input
                  id="atendente"
                  value={ficha.atendente}
                  onChange={(e) => set('atendente', e.target.value)}
                  placeholder="Nome de quem está preenchendo a ficha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="indicacao">
                  Indicação (nome, telefone e detalhes de quem indicou)
                </Label>
                <Input
                  id="indicacao"
                  value={ficha.indicacao}
                  onChange={(e) => set('indicacao', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pessoa atendida</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_atendido">Nome da pessoa atendida</Label>
                <Input
                  id="nome_atendido"
                  value={ficha.nome_atendido}
                  onChange={(e) => set('nome_atendido', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_atendido">CPF da pessoa atendida</Label>
                <Input
                  id="cpf_atendido"
                  value={ficha.cpf_atendido}
                  onChange={(e) => set('cpf_atendido', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atendido_e_titular">É o titular/autor do processo?</Label>
                <select
                  id="atendido_e_titular"
                  className={selectClass}
                  value={ficha.atendido_e_titular}
                  onChange={(e) => set('atendido_e_titular', e.target.value)}
                >
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
              {ficha.atendido_e_titular === 'nao' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vinculo_atendido">Vínculo com o titular</Label>
                    <select
                      id="vinculo_atendido"
                      className={selectClass}
                      value={ficha.vinculo_atendido}
                      onChange={(e) => set('vinculo_atendido', e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {VINCULOS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  {ficha.vinculo_atendido === 'outro_parentesco' && (
                    <div className="space-y-2">
                      <Label htmlFor="vinculo_outro">Especifique o parentesco</Label>
                      <Input
                        id="vinculo_outro"
                        value={ficha.vinculo_outro}
                        onChange={(e) => set('vinculo_outro', e.target.value)}
                      />
                    </div>
                  )}
                  {ficha.vinculo_atendido === 'representante' && (
                    <div className="space-y-2">
                      <Label htmlFor="representante_especificacao">
                        Especificação do representante
                      </Label>
                      <Input
                        id="representante_especificacao"
                        value={ficha.representante_especificacao}
                        onChange={(e) => set('representante_especificacao', e.target.value)}
                        placeholder="Tutor nato, curador ou guarda"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benefício e titular</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="familia_beneficio">Família do benefício</Label>
                <select
                  id="familia_beneficio"
                  className={selectClass}
                  value={ficha.familia_beneficio}
                  onChange={(e) => set('familia_beneficio', e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {FAMILIAS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_beneficio">Tipo específico do benefício</Label>
                <Input
                  id="tipo_beneficio"
                  value={ficha.tipo_beneficio}
                  onChange={(e) => set('tipo_beneficio', e.target.value)}
                  placeholder="Ex.: LOAS idoso, aposentadoria, pensão por morte rural"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_titular">Nome do titular</Label>
                <Input
                  id="nome_titular"
                  value={ficha.nome_titular}
                  onChange={(e) => set('nome_titular', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_titular">CPF do titular</Label>
                <Input
                  id="cpf_titular"
                  value={ficha.cpf_titular}
                  onChange={(e) => set('cpf_titular', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nascimento_titular">Data de nascimento do titular</Label>
                <Input
                  id="nascimento_titular"
                  type="date"
                  value={ficha.nascimento_titular}
                  onChange={(e) => set('nascimento_titular', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone_titular">Telefone para contato</Label>
                <Input
                  id="telefone_titular"
                  value={ficha.telefone_titular}
                  onChange={(e) => set('telefone_titular', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco_titular">Endereço completo do titular</Label>
                <Textarea
                  id="endereco_titular"
                  rows={2}
                  value={ficha.endereco_titular}
                  onChange={(e) => set('endereco_titular', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do titular</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha_meu_inss">Senha MEU INSS (opcional)</Label>
                <Input
                  id="senha_meu_inss"
                  value={ficha.senha_meu_inss}
                  onChange={(e) => set('senha_meu_inss', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se ficar vazia, o sistema cria a tarefa de gerar nova senha junto à agência do
                  INSS.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filiado">É filiado a sindicato?</Label>
                <select
                  id="filiado"
                  className={selectClass}
                  value={ficha.filiado}
                  onChange={(e) => set('filiado', e.target.value)}
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {ficha.filiado === 'sim' && (
                <div className="space-y-2">
                  <Label htmlFor="sindicato_nome">Qual sindicato</Label>
                  <Input
                    id="sindicato_nome"
                    value={ficha.sindicato_nome}
                    onChange={(e) => set('sindicato_nome', e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="escolaridade">Escolaridade</Label>
                <Input
                  id="escolaridade"
                  value={ficha.escolaridade}
                  onChange={(e) => set('escolaridade', e.target.value)}
                  placeholder="Ex.: fundamental incompleto; analphabeto; só assina o nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão atual</Label>
                <Input
                  id="profissao"
                  value={ficha.profissao}
                  onChange={(e) => set('profissao', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parente_ja_atendido">Algum parente já atendeu no escritório?</Label>
                <select
                  id="parente_ja_atendido"
                  className={selectClass}
                  value={ficha.parente_ja_atendido}
                  onChange={(e) => set('parente_ja_atendido', e.target.value)}
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {ficha.parente_ja_atendido === 'sim' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="parente_dados">
                    Dados do parente (nome, CPF, parentesco, telefone)
                  </Label>
                  <Input
                    id="parente_dados"
                    value={ficha.parente_dados}
                    onChange={(e) => set('parente_dados', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bloco do benefício (condicional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ficha.familia_beneficio === 'loas' && (
                <div className="space-y-2">
                  <Label htmlFor="loas_dados">
                    Dados LOAS: idoso (idade) ou deficiência; renda; CadÚnico; moradia; grupo
                    familiar (sem limite); gastos
                  </Label>
                  <Textarea
                    id="loas_dados"
                    rows={4}
                    value={ficha.loas_dados}
                    onChange={(e) => set('loas_dados', e.target.value)}
                  />
                </div>
              )}
              {ficha.familia_beneficio === 'urbano' && (
                <div className="space-y-2">
                  <Label htmlFor="urbano_dados">
                    Dados urbanos: idade 65/62; benefícios anteriores; negativas; judicial;
                    carteira/carnês; estado civil; incapacidade; salário-maternidade;
                    pensão/reclusão
                  </Label>
                  <Textarea
                    id="urbano_dados"
                    rows={4}
                    value={ficha.urbano_dados}
                    onChange={(e) => set('urbano_dados', e.target.value)}
                  />
                </div>
              )}
              {ficha.familia_beneficio === 'rural' && (
                <div className="space-y-2">
                  <Label htmlFor="rural_dados">
                    Dados rurais: terras onde trabalhou; companheiros; filhos; pais;
                    salário-maternidade rural; incapacidade; pensão/reclusão
                  </Label>
                  <Textarea
                    id="rural_dados"
                    rows={4}
                    value={ficha.rural_dados}
                    onChange={(e) => set('rural_dados', e.target.value)}
                  />
                </div>
              )}
              {!ficha.familia_beneficio && (
                <p className="text-sm text-muted-foreground">
                  Escolha a família do benefício para exibir o bloco correspondente.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos e contrato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="solicitou_documentos">
                  Solicitou documentos durante o atendimento?
                </Label>
                <select
                  id="solicitou_documentos"
                  className={selectClass}
                  value={ficha.solicitou_documentos}
                  onChange={(e) => set('solicitou_documentos', e.target.value)}
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {ficha.solicitou_documentos === 'sim' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="docs_data_solicitacao">Data da solicitação</Label>
                    <Input
                      id="docs_data_solicitacao"
                      type="date"
                      value={ficha.docs_data_solicitacao}
                      onChange={(e) => set('docs_data_solicitacao', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docs_prazo_entrega">Prazo para entrega</Label>
                    <Input
                      id="docs_prazo_entrega"
                      type="date"
                      value={ficha.docs_prazo_entrega}
                      onChange={(e) => set('docs_prazo_entrega', e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="contrato_assinado">Cliente assinou contrato?</Label>
                <select
                  id="contrato_assinado"
                  className={selectClass}
                  value={ficha.contrato_assinado}
                  onChange={(e) => set('contrato_assinado', e.target.value)}
                >
                  <option value="">Selecione…</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
              {ficha.contrato_assinado === 'nao' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="assinatura_rogo_dados">
                    Dados do assinante à rogo / procuração pública
                  </Label>
                  <Input
                    id="assinatura_rogo_dados"
                    value={ficha.assinatura_rogo_dados}
                    onChange={(e) => set('assinatura_rogo_dados', e.target.value)}
                    placeholder="Nome, CPF, telefone, estado civil, profissão e endereço"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar ficha de intake'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default NovaFicha
