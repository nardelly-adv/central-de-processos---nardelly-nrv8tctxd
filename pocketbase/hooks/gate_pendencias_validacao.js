// F1-T01 · RN-002/CA-1-002 — Negação auditada: validar documento é da operação documental
onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const virouResolvida =
    antes.getString('status') !== 'resolvida' && e.record.getString('status') === 'resolvida'
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (virouResolvida && papel !== 'operacao_documental') {
    try {
      const trilha = $app.findCollectionByNameOrId('auditoria')
      const entrada = new Record(trilha)
      entrada.set('ator', e.auth ? e.auth.getString('email') + ' (' + papel + ')' : 'anonimo')
      entrada.set('acao', 'negacao')
      entrada.set('entidade', 'pendencias')
      entrada.set('entidade_id', e.record.id)
      entrada.set('estado_anterior', JSON.stringify({ status: antes.getString('status') }))
      entrada.set('estado_novo', JSON.stringify({ status: e.record.getString('status') }))
      $app.save(entrada)
    } catch (err) {
      return e.json(500, {
        status: 500,
        message: 'Falha ao registrar a negação; ação bloqueada (fail-closed).',
      })
    }
    throw new ForbiddenError('Somente a operação documental valida pendências.')
  }
  e.next()
}, 'pendencias')
