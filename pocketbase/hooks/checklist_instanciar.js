// F1-T03 · RN-102 — Instancia checklist demonstrativo sintético para cada caso rural.
// Todos os itens ficam marcados como PENDENTE APROVAÇÃO JURÍDICA; não representam requisito oficial.
onRecordAfterCreateSuccess((e) => {
  const caso = e.record
  const tipo = caso.getString('tipo_beneficio') || 'tipo_rural_nao_informado'
  const tipoDemanda = tipo.includes('incapacidade')
    ? 'incapacidade_rural'
    : tipo.includes('maternidade')
      ? 'salario_maternidade_rural'
      : tipo.includes('morte')
        ? 'pensao_morte_rural'
        : tipo.includes('reclusao')
          ? 'auxilio_reclusao_rural'
          : 'aposentadoria_idade_rural'
  const itens = [
    {
      chave: 'documentos_pessoais',
      nome: 'Documentos pessoais e comprovante de residência',
      obrigatoria: true,
    },
    {
      chave: 'contexto_rural_terra',
      nome: 'Documentos da terra/contexto rural (condicional ao contexto rural)',
      obrigatoria: true,
    },
    {
      chave: 'prova_rural_alternativa',
      nome: 'Prova rural alternativa ou outro documento',
      obrigatoria: true,
    },
  ]
  const checklists = $app.findCollectionByNameOrId('checklists')
  const pendencias = $app.findCollectionByNameOrId('pendencias')
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const checklist = new Record(checklists)
  checklist.set('tipo_demanda', tipoDemanda)
  checklist.set('versao', 1)
  checklist.set('status_aprovacao', 'pendente_aprovacao_juridica')
  checklist.set('itens_json', JSON.stringify(itens))
  checklist.set(
    'observacao',
    'Itens demonstrativos sintéticos; não são checklist jurídico aprovado.',
  )
  $app.save(checklist)
  for (const item of itens) {
    const p = new Record(pendencias)
    p.set('caso', caso.id)
    p.set('descricao', item.nome + ' — PENDENTE APROVAÇÃO JURÍDICA')
    p.set('status', 'aberta')
    p.set('tipo', 'documental')
    p.set('estado_documental', 'solicitada')
    p.set('obrigatoria', item.obrigatoria)
    p.set('checklist_id', checklist.id)
    p.set('item_chave', item.chave)
    $app.save(p)
  }
  const a = new Record(trilha)
  a.set('ator', 'sistema (RN-102)')
  a.set('acao', 'instanciar_checklist')
  a.set('entidade', 'checklists')
  a.set('entidade_id', checklist.id)
  a.set(
    'estado_novo',
    JSON.stringify({ caso: caso.id, tipo: tipoDemanda, versao: 1, aprovacao: 'pendente' }),
  )
  $app.save(a)
  e.next()
}, 'casos')
