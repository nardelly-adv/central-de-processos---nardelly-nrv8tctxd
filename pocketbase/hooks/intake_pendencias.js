// F1-T02 · SPEC-1-002 · RN-101 — Intake sem dado obrigatório gera pendência explícita por falta.
// O caso NUNCA é descartado: cria com pendências explícitas (CA-1-101). Fail-closed de auditoria:
// se uma pendência não puder ser registrada, o erro é logado e visível — nada silencioso.
// Definição aprovada: 06_notas/decisao-intake-campos-2026-10-13.md.
onRecordAfterCreateSuccess((e) => {
  const caso = e.record

  const pendCol = $app.findCollectionByNameOrId('pendencias')
  const trilha = $app.findCollectionByNameOrId('auditoria')

  const vazio = (campo) => {
    const v = caso.getString(campo)
    return !v || !v.trim()
  }

  // 18 obrigatórios aprovados: ausência vira pendência explícita.
  const obrigatorios = [
    ['data_atendimento', 'Data do atendimento'],
    ['canal', 'Canal do atendimento'],
    ['atendente', 'Atendente (quem preencheu a ficha)'],
    ['indicacao', 'Indicação (nome, telefone e detalhes de quem indicou)'],
    ['nome_atendido', 'Nome da pessoa atendida'],
    ['cpf_atendido', 'CPF da pessoa atendida'],
    ['atendido_e_titular', 'Se a pessoa atendida é o titular do processo'],
    ['familia_beneficio', 'Família do benefício (LOAS, urbano ou rural)'],
    ['tipo_beneficio', 'Tipo específico do benefício'],
    ['nome_titular', 'Nome do titular'],
    ['cpf_titular', 'CPF do titular'],
    ['nascimento_titular', 'Data de nascimento do titular'],
    ['telefone_titular', 'Telefone para contato do titular'],
    ['endereco_titular', 'Endereço completo do titular'],
    ['escolaridade', 'Escolaridade'],
    ['profissao', 'Profissão atual'],
    ['parente_ja_atendido', 'Se algum parente já atendeu no escritório'],
    ['contrato_assinado', 'Se o cliente assinou o contrato'],
  ]

  const faltas = []
  for (const par of obrigatorios) {
    if (vazio(par[0])) faltas.push(par[1])
  }

  // Condicionais aprovados: exigidos só quando a condição existe.
  const canal = caso.getString('canal')
  if (
    (canal === 'presencial_sindicato' ||
      canal === 'presencial_externo' ||
      canal === 'indireto_parceiro') &&
    vazio('canal_detalhe')
  ) {
    faltas.push('Detalhe do canal (sindicato, local ou parceiro que indicou)')
  }
  if (caso.getString('atendido_e_titular') === 'nao') {
    if (vazio('vinculo_atendido')) faltas.push('Vínculo da pessoa atendida com o titular')
    if (caso.getString('vinculo_atendido') === 'outro_parentesco' && vazio('vinculo_outro')) {
      faltas.push('Especificação do parentesco')
    }
    if (
      caso.getString('vinculo_atendido') === 'representante' &&
      vazio('representante_especificacao')
    ) {
      faltas.push('Especificação do representante (tutor nato, curador ou guarda)')
    }
  }
  if (caso.getString('filiado') === 'sim' && vazio('sindicato_nome')) {
    faltas.push('Qual sindicato (cliente filiado)')
  }
  if (caso.getString('parente_ja_atendido') === 'sim' && vazio('parente_dados')) {
    faltas.push('Dados do parente que já atendeu (nome, CPF, parentesco e telefone)')
  }
  if (caso.getString('contrato_assinado') === 'nao' && vazio('assinatura_rogo_dados')) {
    faltas.push('Dados do assinante à rogo / procuração pública')
  }
  if (caso.getString('solicitou_documentos') === 'sim') {
    if (vazio('docs_data_solicitacao')) faltas.push('Data da solicitação de documentos')
    if (vazio('docs_prazo_entrega')) faltas.push('Prazo para entrega dos documentos')
  }

  let falha = null
  for (const rotulo of faltas) {
    try {
      const p = new Record(pendCol)
      p.set('caso', caso.id)
      p.set('descricao', 'Pendência de intake — dado obrigatório ausente: ' + rotulo)
      p.set('status', 'aberta')
      $app.save(p)

      const a = new Record(trilha)
      a.set('ator', 'sistema (RN-101)')
      a.set('acao', 'criar')
      a.set('entidade', 'pendencias')
      a.set('entidade_id', p.id)
      a.set('estado_novo', JSON.stringify({ caso: caso.id, pendencia: rotulo, origem: 'RN-101' }))
      $app.save(a)
    } catch (err) {
      falha = String(err)
    }
  }

  // Senha MEU INSS ausente (opcional) cria tarefa de nova senha junto à agência do INSS.
  if (vazio('senha_meu_inss')) {
    try {
      const t = new Record(pendCol)
      t.set('caso', caso.id)
      t.set('descricao', 'Tarefa: gerar nova senha MEU INSS junto à agência do INSS')
      t.set('status', 'aberta')
      $app.save(t)

      const a2 = new Record(trilha)
      a2.set('ator', 'sistema (RN-101)')
      a2.set('acao', 'criar')
      a2.set('entidade', 'pendencias')
      a2.set('entidade_id', t.id)
      a2.set(
        'estado_novo',
        JSON.stringify({ caso: caso.id, pendencia: 'Tarefa senha MEU INSS', origem: 'RN-101' }),
      )
      $app.save(a2)
    } catch (err) {
      falha = String(err)
    }
  }

  if (falha) {
    $app
      .logger()
      .error('RN-101: falha ao gerar pendências do intake', 'caso', caso.id, 'erro', falha)
  }

  e.next()
}, 'casos')
