// F1-T01 · Correção 2: autodates nas coleções base + createRule que permite chegar ao gate auditado
migrate(
  (app) => {
    // 1. created/updated em todas as coleções base (checklist de migração; auditoria exige data/hora — CA-1-003)
    for (const nome of ['casos', 'pendencias', 'rotas_triagem', 'auditoria']) {
      const col = app.findCollectionByNameOrId(nome)
      let temCreated = false,
        temUpdated = false
      for (const f of col.fields) {
        if (f.name === 'created') temCreated = true
        if (f.name === 'updated') temUpdated = true
      }
      if (!temCreated) {
        try {
          col.fields.add(new AutodateField({ name: 'created', onCreate: true }))
        } catch (_) {}
      }
      if (!temUpdated) {
        try {
          col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
        } catch (_) {}
      }
      app.save(col)
    }

    // 2. createRule de rotas_triagem e users: qualquer usuário ativo autenticado chega ao
    //    request-hook, que nega com 403 auditado (CA-1-002) — a matriz continua server-side.
    const rotas = app.findCollectionByNameOrId('rotas_triagem')
    rotas.createRule = '@request.auth.ativo = true'
    app.save(rotas)

    const users = app.findCollectionByNameOrId('users')
    users.createRule = '@request.auth.ativo = true'
    app.save(users)
  },
  (app) => {
    // down: volta createRules restritivas (negação volta a 400, sem trilha)
    try {
      const rotas = app.findCollectionByNameOrId('rotas_triagem')
      rotas.createRule = "@request.auth.ativo = true && @request.auth.papel = 'triagem_juridica'"
      app.save(rotas)
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId('users')
      users.createRule = "@request.auth.ativo = true && @request.auth.papel = 'administracao'"
      app.save(users)
    } catch (_) {}
  },
)
