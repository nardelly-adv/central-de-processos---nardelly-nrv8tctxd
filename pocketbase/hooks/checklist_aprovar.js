// F1-T03 · aprovação jurídica cria nova versão append-only, sem inferir conteúdo.
routerAdd(
  'POST',
  '/backend/v1/checklists/{id}/aprovar',
  (e) => {
    if (!e.auth || e.auth.getString('papel') !== 'advogado_responsavel')
      throw new ForbiddenError('Somente advogado responsável aprova checklist jurídico.')
    const original = $app.findRecordById('checklists', e.request.pathValue('id'))
    if (original.getString('status_aprovacao') !== 'pendente_aprovacao_juridica')
      throw new BadRequestError('Somente checklist pendente pode ser submetido para aprovação.')
    const body = e.requestInfo().body || {}
    const itens = body.itens
    if (!Array.isArray(itens) || itens.length === 0)
      throw new BadRequestError(
        'Envie os itens aprovados pelo jurídico; nenhum conteúdo foi presumido.',
      )
    const chaves = {}
    for (const item of itens) {
      if (
        !item ||
        typeof item.chave !== 'string' ||
        !item.chave.trim() ||
        typeof item.nome !== 'string' ||
        !item.nome.trim() ||
        typeof item.obrigatoria !== 'boolean'
      )
        throw new BadRequestError(
          'Cada item aprovado precisa de chave, nome e decisão obrigatória explícita.',
        )
      if (chaves[item.chave])
        throw new BadRequestError('Chaves de itens repetidas não são permitidas.')
      chaves[item.chave] = true
    }
    const versoes = $app.findRecordsByFilter(
      'checklists',
      'tipo_demanda = {:tipo}',
      '-versao',
      1000,
      0,
      { tipo: original.getString('tipo_demanda') },
    )
    let versao = 1
    for (const item of versoes)
      if (item.getInt('versao') >= versao) versao = item.getInt('versao') + 1
    const checklistCol = $app.findCollectionByNameOrId('checklists')
    const novo = new Record(checklistCol)
    novo.set('tipo_demanda', original.getString('tipo_demanda'))
    novo.set('versao', versao)
    novo.set('status_aprovacao', 'aprovado')
    novo.set('itens_json', JSON.stringify(itens))
    novo.set('aprovado_por', e.auth.id)
    novo.set('aprovado_em', new Date().toISOString())
    novo.set('observacao', 'Aprovado pelo advogado responsável; versão anterior preservada.')
    const audit = new Record($app.findCollectionByNameOrId('auditoria'))
    $app.runInTransaction((tx) => {
      tx.save(novo)
      audit.set('ator', e.auth.getString('email') + ' (advogado_responsavel)')
      audit.set('acao', 'aprovar_nova_versao_checklist')
      audit.set('entidade', 'checklists')
      audit.set('entidade_id', novo.id)
      audit.set(
        'estado_anterior',
        JSON.stringify({
          checklist: original.id,
          versao: original.getInt('versao'),
          status: 'pendente_aprovacao_juridica',
        }),
      )
      audit.set(
        'estado_novo',
        JSON.stringify({ checklist: novo.id, versao, status: 'aprovado', itens: itens.length }),
      )
      tx.save(audit)
    })
    return e.json(201, { id: novo.id, versao, status_aprovacao: 'aprovado' })
  },
  $apis.requireAuth(),
)
