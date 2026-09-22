// F1-T01 · RN-002/CA-1-002 — Negação auditada: gerenciar usuários é da administração
// (supervisão→gerenciar usuários negado; cobre criação e alteração de papel/ativo por não-admin)
onRecordCreateRequest((e) => {
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (!e.auth || papel !== 'administracao') {
    try {
      const trilha = $app.findCollectionByNameOrId('auditoria')
      const entrada = new Record(trilha)
      entrada.set('ator', e.auth ? e.auth.getString('email') + ' (' + papel + ')' : 'anonimo')
      entrada.set('acao', 'negacao')
      entrada.set('entidade', 'users')
      entrada.set('entidade_id', e.record.id)
      entrada.set(
        'estado_novo',
        JSON.stringify({ motivo: 'criar usuário sem papel de administração' }),
      )
      $app.save(entrada)
    } catch (_) {}
    throw new ForbiddenError('Somente a administração gerencia usuários.')
  }
  e.next()
}, 'users')
