// F1-T01 · Correção: campos + regras das coleções base (0001 aplicou parcialmente;
// o construtor new Collection não persistiu fields/regras — aqui usa-se fields.add, padrão que funcionou em users)
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const casosId = app.findCollectionByNameOrId('casos').id

    // --- casos ---
    const casos = app.findCollectionByNameOrId('casos')
    const camposCasos = [
      ['titulo', () => new TextField({ name: 'titulo', required: true })],
      [
        'status',
        () =>
          new SelectField({
            name: 'status',
            maxSelect: 1,
            values: ['aberto', 'em_analise', 'documentacao', 'arquivado'],
          }),
      ],
      ['descricao', () => new TextField({ name: 'descricao' })],
      [
        'criado_por',
        () => new RelationField({ name: 'criado_por', collectionId: usersId, maxSelect: 1 }),
      ],
    ]
    for (const [nome, fab] of camposCasos) {
      let existe = false
      for (const f of casos.fields) {
        if (f.name === nome) existe = true
      }
      if (!existe) {
        try {
          casos.fields.add(fab())
        } catch (_) {}
      }
    }
    casos.listRule =
      "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''"
    casos.viewRule =
      "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''"
    casos.createRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'atendimento' || @request.auth.papel = 'cadastro')"
    casos.updateRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'atendimento' || @request.auth.papel = 'cadastro')"
    casos.deleteRule = null
    app.save(casos)

    // --- pendencias ---
    const pend = app.findCollectionByNameOrId('pendencias')
    const camposPend = [
      [
        'caso',
        () =>
          new RelationField({ name: 'caso', required: true, collectionId: casosId, maxSelect: 1 }),
      ],
      ['descricao', () => new TextField({ name: 'descricao', required: true })],
      [
        'status',
        () => new SelectField({ name: 'status', maxSelect: 1, values: ['aberta', 'resolvida'] }),
      ],
    ]
    for (const [nome, fab] of camposPend) {
      let existe = false
      for (const f of pend.fields) {
        if (f.name === nome) existe = true
      }
      if (!existe) {
        try {
          pend.fields.add(fab())
        } catch (_) {}
      }
    }
    pend.listRule =
      "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''"
    pend.viewRule =
      "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''"
    pend.createRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'cadastro' || @request.auth.papel = 'operacao_documental')"
    pend.updateRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'cadastro' || @request.auth.papel = 'operacao_documental')"
    pend.deleteRule = null
    app.save(pend)

    // --- rotas_triagem ---
    const rotas = app.findCollectionByNameOrId('rotas_triagem')
    const camposRotas = [
      [
        'caso',
        () =>
          new RelationField({ name: 'caso', required: true, collectionId: casosId, maxSelect: 1 }),
      ],
      [
        'rota',
        () =>
          new SelectField({
            name: 'rota',
            required: true,
            maxSelect: 1,
            values: ['triagem_documental', 'analise_juridica', 'arquivamento'],
          }),
      ],
      ['observacao', () => new TextField({ name: 'observacao' })],
      [
        'definido_por',
        () => new RelationField({ name: 'definido_por', collectionId: usersId, maxSelect: 1 }),
      ],
    ]
    for (const [nome, fab] of camposRotas) {
      let existe = false
      for (const f of rotas.fields) {
        if (f.name === nome) existe = true
      }
      if (!existe) {
        try {
          rotas.fields.add(fab())
        } catch (_) {}
      }
    }
    rotas.listRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'advogado_responsavel' || @request.auth.papel = 'supervisao')"
    rotas.viewRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'advogado_responsavel' || @request.auth.papel = 'supervisao')"
    rotas.createRule = "@request.auth.ativo = true && @request.auth.papel = 'triagem_juridica'"
    rotas.updateRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'supervisao')"
    rotas.deleteRule = null
    app.save(rotas)

    // --- auditoria (append-only: escrita só pelo servidor; leitura por supervisão/administração/advogado) ---
    const aud = app.findCollectionByNameOrId('auditoria')
    const camposAud = [
      ['ator', () => new TextField({ name: 'ator' })],
      ['acao', () => new TextField({ name: 'acao', required: true })],
      ['entidade', () => new TextField({ name: 'entidade', required: true })],
      ['entidade_id', () => new TextField({ name: 'entidade_id' })],
      ['estado_anterior', () => new TextField({ name: 'estado_anterior' })],
      ['estado_novo', () => new TextField({ name: 'estado_novo' })],
    ]
    for (const [nome, fab] of camposAud) {
      let existe = false
      for (const f of aud.fields) {
        if (f.name === nome) existe = true
      }
      if (!existe) {
        try {
          aud.fields.add(fab())
        } catch (_) {}
      }
    }
    aud.listRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'supervisao' || @request.auth.papel = 'administracao' || @request.auth.papel = 'advogado_responsavel')"
    aud.viewRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'supervisao' || @request.auth.papel = 'administracao' || @request.auth.papel = 'advogado_responsavel')"
    aud.createRule = null
    aud.updateRule = null
    aud.deleteRule = null
    app.save(aud)
  },
  (app) => {
    // down: apenas volta list/view para superusuário (estado anterior conhecido)
    for (const nome of ['casos', 'pendencias', 'rotas_triagem', 'auditoria']) {
      try {
        const c = app.findCollectionByNameOrId(nome)
        c.listRule = null
        c.viewRule = null
        app.save(c)
      } catch (_) {}
    }
  },
)
