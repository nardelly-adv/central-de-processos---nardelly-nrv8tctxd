// F1-T01 · RN-003 — Auditoria: alteração de pendência documental
// Validação para "resolvida" é decidida pelo gate_pendencias_validacao. Não criar um
// registro "alterar" antes de uma requisição que será negada.
onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const virouResolvida =
    antes.getString('status') !== 'resolvida' && e.record.getString('status') === 'resolvida'
  const papel = e.auth ? e.auth.getString('papel') : ''

  if (virouResolvida && papel !== 'operacao_documental') {
    e.next()
    return
  }

  const trilha = $app.findCollectionByNameOrId('auditoria')
  const entrada = new Record(trilha)
  entrada.set('ator', e.auth ? e.auth.getString('email') + ' (' + papel + ')' : 'anonimo')
  entrada.set('acao', 'alterar')
  entrada.set('entidade', 'pendencias')
  entrada.set('entidade_id', e.record.id)
  entrada.set('estado_anterior', JSON.stringify({ status: antes.getString('status') }))
  entrada.set('estado_novo', JSON.stringify({ status: e.record.getString('status') }))
  try {
    $app.save(entrada)
  } catch (err) {
    return e.json(500, {
      status: 500,
      message: 'Falha ao registrar auditoria; ação bloqueada (fail-closed, RN-003).',
    })
  }
  e.next()
}, 'pendencias')
