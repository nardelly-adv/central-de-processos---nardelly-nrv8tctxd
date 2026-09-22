// F1-T01 · RN-002/CA-1-002 — Negação auditada: só triagem_juridica define rota (atendimento→rota negado)
onRecordCreateRequest((e) => {
  const permitidos = ['triagem_juridica']
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (!e.auth || permitidos.indexOf(papel) === -1) {
    try {
      const trilha = $app.findCollectionByNameOrId('auditoria')
      const entrada = new Record(trilha)
      entrada.set('ator', e.auth ? e.auth.getString('email') + ' (' + papel + ')' : 'anonimo')
      entrada.set('acao', 'negacao')
      entrada.set('entidade', 'rotas_triagem')
      entrada.set('entidade_id', e.record.id)
      entrada.set('estado_novo', JSON.stringify({ motivo: 'criar rota sem papel autorizado' }))
      $app.save(entrada)
    } catch (_) {}
    throw new ForbiddenError('Seu papel não autoriza definir rota de triagem.')
  }
  e.next()
}, 'rotas_triagem')
