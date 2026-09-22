// F1-T01 · SPEC-1-001 — Fixtures sintéticas: um usuário por papel + caso e pendência de demonstração
// Nenhum dado real (B-POL-01). Senha única de demonstração para o teste do champion.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const casosCol = app.findCollectionByNameOrId('casos')
    const pendenciasCol = app.findCollectionByNameOrId('pendencias')

    const equipe = [
      ['ana.atendimento@central.local', 'atendimento', 'Ana Souza'],
      ['carlos.cadastro@central.local', 'cadastro', 'Carlos Lima'],
      ['beatriz.documental@central.local', 'operacao_documental', 'Beatriz Moraes'],
      ['daniela.triagem@central.local', 'triagem_juridica', 'Daniela Castro'],
      ['ricardo.advogado@central.local', 'advogado_responsavel', 'Ricardo Guimarães'],
      ['sofia.supervisao@central.local', 'supervisao', 'Sofia Costa'],
      ['marcio.administracao@central.local', 'administracao', 'Márcio Andrade'],
    ]

    const criados = {}
    for (const [email, papel, nome] of equipe) {
      let registro
      try {
        registro = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        registro = new Record(users)
        registro.setEmail(email)
        registro.setPassword('Nardelly@2026')
        registro.set('name', nome)
        registro.set('papel', papel)
        registro.set('ativo', true)
        app.save(registro)
      }
      criados[papel] = registro
    }

    // Caso sintético mínimo
    let caso
    try {
      caso = app.findFirstRecordByFilter(
        'casos',
        "titulo = 'Caso demonstração — Ação indenizatória'",
      )
    } catch (_) {
      caso = new Record(casosCol)
      caso.set('titulo', 'Caso demonstração — Ação indenizatória')
      caso.set('status', 'aberto')
      caso.set('descricao', 'Massa sintética para validação de papéis e auditoria (F1-T01).')
      caso.set('criado_por', criados['atendimento'].id)
      app.save(caso)
    }

    // Pendência sintética vinculada
    try {
      app.findFirstRecordByFilter(
        'pendencias',
        "descricao = 'Pendência sintética — anexar procuração'",
      )
    } catch (_) {
      const p = new Record(pendenciasCol)
      p.set('caso', caso.id)
      p.set('descricao', 'Pendência sintética — anexar procuração')
      p.set('status', 'aberta')
      app.save(p)
    }
  },
  (app) => {
    for (const email of [
      'ana.atendimento@central.local',
      'carlos.cadastro@central.local',
      'beatriz.documental@central.local',
      'daniela.triagem@central.local',
      'ricardo.advogado@central.local',
      'sofia.supervisao@central.local',
      'marcio.administracao@central.local',
    ]) {
      try {
        app.delete(app.findAuthRecordByEmail('_pb_users_auth_', email))
      } catch (_) {}
    }
    try {
      app.delete(
        app.findFirstRecordByFilter('casos', "titulo = 'Caso demonstração — Ação indenizatória'"),
      )
    } catch (_) {}
  },
)
