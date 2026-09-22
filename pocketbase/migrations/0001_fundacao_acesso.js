// F1-T01 · SPEC-1-001 — Fundação de acesso: papéis, RBAC server-side e trilha de auditoria
// Ordem: users (papel/ativo/regras) → casos → pendencias → rotas_triagem → auditoria
migrate(
  (app) => {
    // 1. Coleção de autenticação: campo papel (7 valores fixos da SPEC) + ativo (revogação)
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(
      new SelectField({
        name: 'papel',
        required: true,
        maxSelect: 1,
        values: [
          'atendimento',
          'cadastro',
          'operacao_documental',
          'triagem_juridica',
          'advogado_responsavel',
          'supervisao',
          'administracao',
        ],
      }),
    )
    users.fields.add(new BoolField({ name: 'ativo' }))
    users.listRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'administracao' || id = @request.auth.id)"
    users.viewRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'administracao' || id = @request.auth.id)"
    users.createRule = "@request.auth.ativo = true && @request.auth.papel = 'administracao'"
    users.updateRule =
      "@request.auth.ativo = true && (@request.auth.papel = 'administracao' || id = @request.auth.id)"
    users.deleteRule = null
    app.save(users)

    // 2. Casos (recorte mínimo para aplicar a matriz de papéis; modelagem completa é a SPEC-1-002)
    const casos = new Collection({
      name: 'casos',
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
      fields: [
        new TextField({ name: 'titulo', required: true }),
        new SelectField({
          name: 'status',
          maxSelect: 1,
          values: ['aberto', 'em_analise', 'documentacao', 'arquivado'],
        }),
        new TextField({ name: 'descricao' }),
        new RelationField({ name: 'criado_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
        new AutodateField({ name: 'created', onCreate: true }),
        new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
      ],
    })
    app.save(casos)

    // 3. Pendências documentais (recorte mínimo; validação documental é alvo do CA-1-002)
    const pendencias = new Collection({
      name: 'pendencias',
      type: 'base',
      listRule:
        "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''",
      viewRule:
        "@request.auth.ativo = true && @request.auth.papel != 'administracao' && @request.auth.papel != ''",
      createRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'cadastro' || @request.auth.papel = 'operacao_documental')",
      updateRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'cadastro' || @request.auth.papel = 'operacao_documental')",
      deleteRule: null,
      fields: [
        new RelationField({ name: 'caso', required: true, collectionId: casos.id, maxSelect: 1 }),
        new TextField({ name: 'descricao', required: true }),
        new SelectField({ name: 'status', maxSelect: 1, values: ['aberta', 'resolvida'] }),
        new AutodateField({ name: 'created', onCreate: true }),
        new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
      ],
    })
    app.save(pendencias)

    // 4. Rotas de triagem (alvo da prova negativa atendimento→rota, CA-1-002)
    const rotas = new Collection({
      name: 'rotas_triagem',
      type: 'base',
      listRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'advogado_responsavel' || @request.auth.papel = 'supervisao')",
      viewRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'advogado_responsavel' || @request.auth.papel = 'supervisao')",
      createRule: "@request.auth.ativo = true && @request.auth.papel = 'triagem_juridica'",
      updateRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'triagem_juridica' || @request.auth.papel = 'supervisao')",
      deleteRule: null,
      fields: [
        new RelationField({ name: 'caso', required: true, collectionId: casos.id, maxSelect: 1 }),
        new SelectField({
          name: 'rota',
          required: true,
          maxSelect: 1,
          values: ['triagem_documental', 'analise_juridica', 'arquivamento'],
        }),
        new TextField({ name: 'observacao' }),
        new RelationField({ name: 'definido_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
        new AutodateField({ name: 'created', onCreate: true }),
        new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
      ],
    })
    app.save(rotas)

    // 5. Trilha de auditoria — append-only: escrita somente pelo servidor (regras nulas),
    //    leitura por supervisão, administração e advogado responsável
    const auditoria = new Collection({
      name: 'auditoria',
      type: 'base',
      listRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'supervisao' || @request.auth.papel = 'administracao' || @request.auth.papel = 'advogado_responsavel')",
      viewRule:
        "@request.auth.ativo = true && (@request.auth.papel = 'supervisao' || @request.auth.papel = 'administracao' || @request.auth.papel = 'advogado_responsavel')",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        new TextField({ name: 'ator' }),
        new TextField({ name: 'acao', required: true }),
        new TextField({ name: 'entidade', required: true }),
        new TextField({ name: 'entidade_id' }),
        // adapta-divida: estados serializados em texto (JSON.stringify); campo JSON nativo quando a SPEC-1-002 exigir consultas por conteúdo
        new TextField({ name: 'estado_anterior' }),
        new TextField({ name: 'estado_novo' }),
        new AutodateField({ name: 'created', onCreate: true }),
      ],
    })
    app.save(auditoria)
  },
  (app) => {
    // Reversão: remove coleções criadas e tenta reverter campos/regras de users (best-effort)
    for (const nome of ['rotas_triagem', 'pendencias', 'casos', 'auditoria']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
    try {
      const users = app.findCollectionByNameOrId('users')
      users.listRule = null
      users.viewRule = null
      users.createRule = null
      users.updateRule = null
      users.deleteRule = null
      try {
        users.fields.removeByName('papel')
      } catch (_) {}
      try {
        users.fields.removeByName('ativo')
      } catch (_) {}
      app.save(users)
    } catch (_) {}
  },
)
