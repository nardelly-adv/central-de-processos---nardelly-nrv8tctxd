// F1-T03 · versão de checklist é imutável depois da aprovação; migração aditiva.
migrate(
  (app) => {
    const casos = app.findCollectionByNameOrId('casos')
    const pendencias = app.findCollectionByNameOrId('pendencias')
    const protocolos = app.findCollectionByNameOrId('protocolos')
    const checklists = app.findCollectionByNameOrId('checklists')

    // Verificar duplicatas antes dos índices únicos; nunca apagar registros para fazer caber.
    const protocolosExistentes = app.findRecordsByFilter('protocolos', 'id != ""', '', 5000, 0)
    const seenProtocolos = {}
    for (const r of protocolosExistentes) {
      const key = r.getString('pendencia')
      if (!key) continue
      if (seenProtocolos[key])
        throw new Error(
          'Há protocolos duplicados por pendência; migração interrompida sem perda de dados.',
        )
      seenProtocolos[key] = true
    }
    const checklistsExistentes = app.findRecordsByFilter('checklists', 'id != ""', '', 5000, 0)
    const seenVersoes = {}
    for (const r of checklistsExistentes) {
      const key = r.getString('tipo_demanda') + ':' + r.getInt('versao')
      if (seenVersoes[key])
        throw new Error('Há versões duplicadas; migração interrompida sem perda de dados.')
      seenVersoes[key] = true
    }
    const pendenciasExistentes = app.findRecordsByFilter('pendencias', 'id != ""', '', 5000, 0)
    const seenItens = {}
    for (const r of pendenciasExistentes) {
      const checklistId = r.getString('checklist_id')
      const item = r.getString('item_chave')
      if (!checklistId || !item || r.getString('reenvio_de')) continue
      const key = r.getString('caso') + ':' + checklistId + ':' + item
      if (seenItens[key])
        throw new Error(
          'Há itens duplicados no mesmo caso/checklist; migração interrompida sem perda de dados.',
        )
      seenItens[key] = true
    }

    if (!checklists.fields.getByName('created'))
      checklists.fields.add(new AutodateField({ name: 'created', onCreate: true }))
    if (!checklists.fields.getByName('updated'))
      checklists.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    if (!protocolos.fields.getByName('updated'))
      protocolos.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    if (!casos.fields.getByName('checklist_atual'))
      casos.fields.add(
        new RelationField({ name: 'checklist_atual', collectionId: checklists.id, maxSelect: 1 }),
      )
    if (!pendencias.fields.getByName('validada_por'))
      pendencias.fields.add(
        new RelationField({ name: 'validada_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    if (!pendencias.fields.getByName('validada_em'))
      pendencias.fields.add(new DateField({ name: 'validada_em' }))
    if (!pendencias.fields.getByName('reenvio_de'))
      pendencias.fields.add(
        new RelationField({ name: 'reenvio_de', collectionId: pendencias.id, maxSelect: 1 }),
      )
    if (!pendencias.fields.getByName('orientacao_aprovada_por'))
      pendencias.fields.add(
        new RelationField({
          name: 'orientacao_aprovada_por',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    if (!pendencias.fields.getByName('orientacao_aprovada_em'))
      pendencias.fields.add(new DateField({ name: 'orientacao_aprovada_em' }))

    protocolos.addIndex('idx_protocolos_pendencia_unico', true, 'pendencia', '')
    checklists.addIndex('idx_checklists_tipo_versao_unico', true, 'tipo_demanda, versao', '')
    pendencias.addIndex(
      'idx_pendencias_caso_checklist_item_unico',
      true,
      'caso, checklist_id, item_chave',
      'checklist_id <> "" AND item_chave <> "" AND reenvio_de = ""',
    )
    // Conteúdo jurídico nunca é editado por CRUD direto; aprovação vai por rota validada.
    checklists.createRule = null
    checklists.updateRule = null

    // Salvar as alterações de schema antes de inserir versões que dependem do campo created.
    app.save(casos)
    app.save(pendencias)
    app.save(protocolos)
    app.save(checklists)

    // Os itens demonstrativos explicitamente rotulados como pendentes deixam de bloquear.
    const itensLegados = app.findRecordsByFilter(
      'pendencias',
      'checklist_id != "" && descricao ~ "PENDENTE APROVAÇÃO JURÍDICA"',
      '',
      5000,
      0,
    )
    for (const item of itensLegados) {
      item.set('obrigatoria', false)
      app.save(item)
    }
    // Checklists existentes são append-only: não editar versões já registradas.

    // Plano B da SPEC: cinco tipos rurais aprovados para demonstração, versão sintética sem itens obrigatórios.
    const tipos = [
      'aposentadoria_idade_rural',
      'incapacidade_rural',
      'salario_maternidade_rural',
      'pensao_morte_rural',
      'auxilio_reclusao_rural',
    ]
    const trilha = app.findCollectionByNameOrId('auditoria')
    const itensSinteticos = [
      {
        chave: 'documentos_pessoais',
        nome: 'Documentos pessoais e comprovante de residência',
        obrigatoria: false,
      },
      {
        chave: 'contexto_rural_terra',
        nome: 'Documentos da terra/contexto rural — condicional ao contexto rural',
        obrigatoria: false,
      },
      {
        chave: 'prova_rural_alternativa',
        nome: 'Exemplo de prova rural alternativa — rol não exaustivo',
        obrigatoria: false,
      },
      {
        chave: 'outro_documento',
        nome: 'Outro documento (item demonstrativo)',
        obrigatoria: false,
      },
    ]
    for (const tipo of tipos) {
      const atuais = app.findRecordsByFilter(
        'checklists',
        'tipo_demanda = {:tipo}',
        '-versao',
        500,
        0,
        { tipo },
      )
      let nextVersion = 1
      let hasPlanoB = false
      for (const row of atuais) {
        if (row.getInt('versao') >= nextVersion) nextVersion = row.getInt('versao') + 1
        if (row.getString('observacao').includes('PLANO B SINTÉTICO F1-T03')) hasPlanoB = true
      }
      if (hasPlanoB) continue
      const checklist = new Record(checklists)
      checklist.set('tipo_demanda', tipo)
      checklist.set('versao', nextVersion)
      checklist.set('status_aprovacao', 'pendente_aprovacao_juridica')
      checklist.set('itens_json', JSON.stringify(itensSinteticos))
      checklist.set(
        'observacao',
        'PLANO B SINTÉTICO F1-T03. Exemplos opcionais; B-CHK-01 pendente. Não usar como checklist oficial.',
      )
      app.save(checklist)
      const log = new Record(trilha)
      log.set('ator', 'sistema (migração F1-T03)')
      log.set('acao', 'criar_plano_b_sintetico')
      log.set('entidade', 'checklists')
      log.set('entidade_id', checklist.id)
      log.set(
        'estado_novo',
        JSON.stringify({
          tipo_demanda: tipo,
          versao: nextVersion,
          status: 'pendente_aprovacao_juridica',
          itens_opcionais: itensSinteticos.length,
        }),
      )
      app.save(log)
    }
  },
  (app) => {
    // Segurança: manter schema/índices vinculados a registros já criados; não descartar evidência documental.
    console.log(
      'Migração F1-T03 0007 sem rollback destrutivo; reversão requer plano explícito de preservação de dados.',
    )
  },
)
