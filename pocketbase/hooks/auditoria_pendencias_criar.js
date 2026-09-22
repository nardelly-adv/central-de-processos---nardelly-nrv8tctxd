// F1-T01 · RN-003 — Auditoria: criação de pendência documental
onRecordCreateRequest((e) => {
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const entrada = new Record(trilha)
  entrada.set(
    'ator',
    e.auth ? e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')' : 'anonimo',
  )
  entrada.set('acao', 'criar')
  entrada.set('entidade', 'pendencias')
  entrada.set('entidade_id', e.record.id)
  entrada.set(
    'estado_novo',
    JSON.stringify({
      descricao: e.record.getString('descricao'),
      status: e.record.getString('status'),
    }),
  )
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
