// F1-T03 · instancia checklist por versão aprovada ou pelo plano B sintético rotulado.
routerAdd(
  'POST',
  '/backend/v1/casos/{id}/instanciar-checklist',
  (e) => {
    const papel = e.auth ? e.auth.getString('papel') : ''
    if (!['atendimento', 'cadastro'].includes(papel))
      throw new ForbiddenError('Papel sem permissão para instanciar checklist.')
    const casoId = e.request.pathValue('id')
    const caso = $app.findRecordById('casos', casoId)
    if (caso.getString('familia_beneficio') !== 'rural')
      throw new BadRequestError('Checklist demonstrativo disponível somente para família rural.')
    const tipo = (caso.getString('tipo_beneficio') || '').toLowerCase()
    let tipoDemanda = ''
    if (tipo.includes('aposentadoria por idade rural')) tipoDemanda = 'aposentadoria_idade_rural'
    else if (tipo.includes('incapacidade')) tipoDemanda = 'incapacidade_rural'
    else if (tipo.includes('salário-maternidade') || tipo.includes('salario-maternidade'))
      tipoDemanda = 'salario_maternidade_rural'
    else if (tipo.includes('pensão por morte') || tipo.includes('pensao por morte'))
      tipoDemanda = 'pensao_morte_rural'
    else if (tipo.includes('auxílio-reclusão') || tipo.includes('auxilio-reclusao'))
      tipoDemanda = 'auxilio_reclusao_rural'
    if (!tipoDemanda)
      throw new BadRequestError(
        'Tipo rural sem correspondência no recorte sintético; nenhum item foi criado.',
      )
    if (caso.getString('checklist_atual')) {
      const atual = $app.findRecordById('checklists', caso.getString('checklist_atual'))
      return e.json(200, {
        checklist: atual.id,
        versao: atual.getInt('versao'),
        status_aprovacao: atual.getString('status_aprovacao'),
        existente: true,
      })
    }
    const versoes = $app.findRecordsByFilter(
      'checklists',
      'tipo_demanda = {:tipo}',
      '-versao',
      500,
      0,
      { tipo: tipoDemanda },
    )
    let checklistEscolhido = null
    for (const c of versoes)
      if (c.getString('status_aprovacao') === 'aprovado') {
        checklistEscolhido = c
        break
      }
    if (!checklistEscolhido)
      for (const c of versoes)
        if (c.getString('observacao').includes('PLANO B SINTÉTICO F1-T03')) {
          checklistEscolhido = c
          break
        }
    if (!checklistEscolhido)
      throw new BadRequestError('Não há checklist aprovado nem plano B sintético para este tipo.')
    let itens = []
    try {
      itens = JSON.parse(checklistEscolhido.getString('itens_json') || '[]')
    } catch (_) {
      throw new InternalServerError('A versão do checklist contém itens inválidos.')
    }
    if (!Array.isArray(itens) || itens.length === 0)
      throw new BadRequestError('A versão escolhida não contém itens demonstráveis.')
    const pendenciasCol = $app.findCollectionByNameOrId('pendencias')
    const auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    const criadas = []
    const status = checklistEscolhido.getString('status_aprovacao')
    $app.runInTransaction((tx) => {
      for (const item of itens) {
        if (
          !item ||
          typeof item.chave !== 'string' ||
          !item.chave ||
          typeof item.nome !== 'string' ||
          !item.nome
        )
          throw new BadRequestError('Item de checklist inválido.')
        const pendencia = new Record(pendenciasCol)
        pendencia.set('caso', casoId)
        pendencia.set(
          'descricao',
          item.nome +
            (status === 'aprovado' ? '' : ' — EXEMPLO OPCIONAL · PENDENTE APROVAÇÃO JURÍDICA'),
        )
        pendencia.set('status', 'aberta')
        pendencia.set('tipo', 'documental')
        pendencia.set('estado_documental', 'solicitada')
        pendencia.set('obrigatoria', status === 'aprovado' && item.obrigatoria === true)
        pendencia.set('checklist_id', checklistEscolhido.id)
        pendencia.set('item_chave', item.chave)
        tx.save(pendencia)
        criadas.push(pendencia.id)
        const itemAudit = new Record(auditoriaCol)
        itemAudit.set('ator', e.auth.getString('email') + ' (' + papel + ')')
        itemAudit.set('acao', 'criar_pendencia_checklist')
        itemAudit.set('entidade', 'pendencias')
        itemAudit.set('entidade_id', pendencia.id)
        itemAudit.set(
          'estado_novo',
          JSON.stringify({
            caso: casoId,
            checklist: checklistEscolhido.id,
            item: item.chave,
            obrigatoria: pendencia.getBool('obrigatoria'),
          }),
        )
        tx.save(itemAudit)
      }
      caso.set('checklist_atual', checklistEscolhido.id)
      tx.save(caso)
      const log = new Record(auditoriaCol)
      log.set('ator', e.auth.getString('email') + ' (' + papel + ')')
      log.set('acao', 'instanciar_checklist')
      log.set('entidade', 'checklists')
      log.set('entidade_id', checklistEscolhido.id)
      log.set(
        'estado_novo',
        JSON.stringify({
          caso: casoId,
          tipo: tipoDemanda,
          versao: checklistEscolhido.getInt('versao'),
          status,
          pendencias: criadas.length,
        }),
      )
      tx.save(log)
    })
    return e.json(201, {
      checklist: checklistEscolhido.id,
      versao: checklistEscolhido.getInt('versao'),
      status_aprovacao: status,
      pendencias: criadas,
    })
  },
  $apis.requireAuth(),
)
