// F1-T03 · SPEC-1-002 — checklist, estados documentais e protocolos.
// Conteúdo demonstrativo sintético; B-CHK-01 permanece pendente de aprovação jurídica.
migrate(
  (app) => {
    const casos = app.findCollectionByNameOrId('casos')
    const pendencias = app.findCollectionByNameOrId('pendencias')
    const usersId = '_pb_users_auth_'

    const add = (collection, field) => {
      try {
        collection.fields.add(field)
      } catch (_) {}
    }

    add(
      casos,
      new SelectField({
        name: 'estado_operacional',
        maxSelect: 1,
        values: ['em_documentacao', 'pronto_triagem'],
      }),
    )
    add(casos, new TextField({ name: 'excecao_justificativa' }))
    add(casos, new RelationField({ name: 'excecao_por', collectionId: usersId, maxSelect: 1 }))
    add(pendencias, new TextField({ name: 'tipo', max: 120 }))
    add(
      pendencias,
      new SelectField({
        name: 'estado_documental',
        maxSelect: 1,
        values: ['solicitada', 'recebida', 'em_conferencia', 'validada', 'devolvida', 'pendente'],
      }),
    )
    add(pendencias, new BoolField({ name: 'obrigatoria' }))
    add(pendencias, new TextField({ name: 'checklist_id', max: 64 }))
    add(pendencias, new TextField({ name: 'item_chave', max: 120 }))
    add(pendencias, new TextField({ name: 'motivo_devolucao' }))
    add(pendencias, new TextField({ name: 'orientacao' }))
    add(pendencias, new RelationField({ name: 'responsavel', collectionId: usersId, maxSelect: 1 }))
    app.save(pendencias)

    const checklists = new Collection({
      name: 'checklists',
      type: 'base',
      listRule: "@request.auth.ativo = true && @request.auth.papel != ''",
      viewRule: "@request.auth.ativo = true && @request.auth.papel != ''",
      createRule: "@request.auth.ativo = true && @request.auth.papel = 'administracao'",
      updateRule: "@request.auth.ativo = true && @request.auth.papel = 'administracao'",
      deleteRule: null,
    })
    add(
      checklists,
      new SelectField({
        name: 'tipo_demanda',
        required: true,
        maxSelect: 1,
        values: [
          'aposentadoria_idade_rural',
          'incapacidade_rural',
          'salario_maternidade_rural',
          'pensao_morte_rural',
          'auxilio_reclusao_rural',
        ],
      }),
    )
    add(checklists, new NumberField({ name: 'versao', required: true, min: 1 }))
    add(
      checklists,
      new SelectField({
        name: 'status_aprovacao',
        required: true,
        maxSelect: 1,
        values: ['pendente_aprovacao_juridica', 'aprovado'],
      }),
    )
    add(checklists, new TextField({ name: 'itens_json', required: true }))
    add(
      checklists,
      new RelationField({ name: 'aprovado_por', collectionId: usersId, maxSelect: 1 }),
    )
    add(checklists, new DateField({ name: 'aprovado_em' }))
    add(checklists, new TextField({ name: 'observacao' }))
    app.save(checklists)

    const protocolos = new Collection({
      name: 'protocolos',
      type: 'base',
      listRule: "@request.auth.ativo = true && @request.auth.papel != ''",
      viewRule: "@request.auth.ativo = true && @request.auth.papel != ''",
      createRule: "@request.auth.ativo = true && @request.auth.papel = 'operacao_documental'",
      updateRule: null,
      deleteRule: null,
    })
    add(
      protocolos,
      new RelationField({ name: 'caso', required: true, collectionId: casos.id, maxSelect: 1 }),
    )
    add(
      protocolos,
      new RelationField({
        name: 'pendencia',
        required: true,
        collectionId: pendencias.id,
        maxSelect: 1,
      }),
    )
    add(protocolos, new TextField({ name: 'numero', required: true, max: 40 }))
    add(protocolos, new DateField({ name: 'recebido_em', required: true }))
    add(
      protocolos,
      new RelationField({
        name: 'recebido_por',
        required: true,
        collectionId: usersId,
        maxSelect: 1,
      }),
    )
    add(protocolos, new TextField({ name: 'ciencia_responsavel' }))
    add(protocolos, new TextField({ name: 'observacao' }))
    add(protocolos, new AutodateField({ name: 'created', onCreate: true }))
    app.save(protocolos)
  },
  (app) => {
    for (const nome of ['protocolos', 'checklists']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
