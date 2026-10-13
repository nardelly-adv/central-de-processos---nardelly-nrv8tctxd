// F1-T02 · SPEC-1-002 · RN-101 — Campos da ficha de intake aprovados pela Champion (2026-10-13)
// Fonte da definição: 06_notas/decisao-intake-campos-2026-10-13.md (18 obrigatórios + condicionais + opcionais).
// Padrão fields.add (aprendizado 0003: construtor literal não persiste campos).
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const casos = app.findCollectionByNameOrId('casos')
    const casosId = casos.id

    const camposNovos = [
      () => new DateField({ name: 'data_atendimento' }),
      () =>
        new SelectField({
          name: 'canal',
          maxSelect: 1,
          values: [
            'ligacao',
            'whatsapp',
            'digisac',
            'presencial_escritorio',
            'presencial_sindicato',
            'presencial_externo',
            'indireto_parceiro',
          ],
        }),
      () => new TextField({ name: 'canal_detalhe' }),
      () => new TextField({ name: 'atendente' }),
      () => new TextField({ name: 'indicacao' }),
      () => new TextField({ name: 'nome_atendido' }),
      () => new TextField({ name: 'cpf_atendido' }),
      () => new SelectField({ name: 'atendido_e_titular', maxSelect: 1, values: ['sim', 'nao'] }),
      () =>
        new SelectField({
          name: 'vinculo_atendido',
          maxSelect: 1,
          values: ['pai_mae', 'conjuge', 'outro_parentesco', 'representante'],
        }),
      () => new TextField({ name: 'vinculo_outro' }),
      () => new TextField({ name: 'representante_especificacao' }),
      () =>
        new SelectField({
          name: 'familia_beneficio',
          maxSelect: 1,
          values: ['loas', 'urbano', 'rural'],
        }),
      () => new TextField({ name: 'tipo_beneficio' }),
      () => new TextField({ name: 'nome_titular' }),
      () => new TextField({ name: 'cpf_titular' }),
      () => new DateField({ name: 'nascimento_titular' }),
      () => new TextField({ name: 'telefone_titular' }),
      () => new TextField({ name: 'endereco_titular' }),
      () => new TextField({ name: 'senha_meu_inss' }),
      () => new SelectField({ name: 'filiado', maxSelect: 1, values: ['nao', 'sim'] }),
      () => new TextField({ name: 'sindicato_nome' }),
      () => new TextField({ name: 'escolaridade' }),
      () => new TextField({ name: 'profissao' }),
      () => new SelectField({ name: 'parente_ja_atendido', maxSelect: 1, values: ['nao', 'sim'] }),
      () => new TextField({ name: 'parente_dados' }),
      () => new SelectField({ name: 'contrato_assinado', maxSelect: 1, values: ['sim', 'nao'] }),
      () => new TextField({ name: 'assinatura_rogo_dados' }),
      () => new SelectField({ name: 'solicitou_documentos', maxSelect: 1, values: ['nao', 'sim'] }),
      () => new DateField({ name: 'docs_data_solicitacao' }),
      () => new DateField({ name: 'docs_prazo_entrega' }),
      () => new TextField({ name: 'loas_dados' }),
      () => new TextField({ name: 'urbano_dados' }),
      () => new TextField({ name: 'rural_dados' }),
    ]
    for (const fabrica of camposNovos) {
      const campo = fabrica()
      let existe = false
      for (const f of casos.fields) {
        if (f.name === campo.name) existe = true
      }
      if (!existe) {
        try {
          casos.fields.add(campo)
        } catch (_) {}
      }
    }
    app.save(casos)

    // Coleção pessoas: titular, pessoa atendida, representante, grupo familiar (sem limite fixo),
    // dependente, assinante à rogo e parente que já foi cliente — com vínculo e CPF.
    const pessoas = new Collection({
      name: 'pessoas',
      type: 'base',
      listRule:
        "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''",
      viewRule:
        "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''",
      createRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'atendimento' || @request.auth.papel = 'cadastro')",
      updateRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'atendimento' || @request.auth.papel = 'cadastro')",
      deleteRule: null,
    })
    pessoas.fields.add(
      new RelationField({ name: 'caso', required: true, collectionId: casosId, maxSelect: 1 }),
    )
    pessoas.fields.add(new TextField({ name: 'nome', required: true }))
    pessoas.fields.add(new TextField({ name: 'cpf' }))
    pessoas.fields.add(
      new SelectField({
        name: 'vinculo',
        required: true,
        maxSelect: 1,
        values: [
          'atendido',
          'titular',
          'representante',
          'grupo_familiar',
          'dependente',
          'assinante_rogo',
          'parente_cliente',
        ],
      }),
    )
    pessoas.fields.add(new TextField({ name: 'especificacao' }))
    pessoas.fields.add(new TextField({ name: 'telefone' }))
    pessoas.fields.add(new AutodateField({ name: 'created', onCreate: true }))
    pessoas.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    app.save(pessoas)
  },
  (app) => {
    // Reversão: remove a coleção pessoas e os campos adicionados a casos (best-effort).
    try {
      app.delete(app.findCollectionByNameOrId('pessoas'))
    } catch (_) {}
    try {
      const casos = app.findCollectionByNameOrId('casos')
      for (const nome of [
        'data_atendimento',
        'canal',
        'canal_detalhe',
        'atendente',
        'indicacao',
        'nome_atendido',
        'cpf_atendido',
        'atendido_e_titular',
        'vinculo_atendido',
        'vinculo_outro',
        'representante_especificacao',
        'familia_beneficio',
        'tipo_beneficio',
        'nome_titular',
        'cpf_titular',
        'nascimento_titular',
        'telefone_titular',
        'endereco_titular',
        'senha_meu_inss',
        'filiado',
        'sindicato_nome',
        'escolaridade',
        'profissao',
        'parente_ja_atendido',
        'parente_dados',
        'contrato_assinado',
        'assinatura_rogo_dados',
        'solicitou_documentos',
        'docs_data_solicitacao',
        'docs_prazo_entrega',
        'loas_dados',
        'urbano_dados',
        'rural_dados',
      ]) {
        try {
          casos.fields.removeByName(nome)
        } catch (_) {}
      }
      app.save(casos)
    } catch (_) {}
  },
)
