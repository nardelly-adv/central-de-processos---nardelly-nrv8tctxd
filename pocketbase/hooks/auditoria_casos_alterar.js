// F1-T01 · RN-003 — Auditoria: alteração de caso (estados anterior e novo)
onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  if (
    antes.getString('estado_operacional') !== e.record.getString('estado_operacional') ||
    antes.getString('excecao_justificativa') !== e.record.getString('excecao_justificativa') ||
    antes.getString('excecao_por') !== e.record.getString('excecao_por')
  ) {
    e.next()
    return
  }
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const entrada = new Record(trilha)
  entrada.set(
    'ator',
    e.auth ? e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')' : 'anonimo',
  )
  entrada.set('acao', 'alterar')
  entrada.set('entidade', 'casos')
  entrada.set('entidade_id', e.record.id)
  entrada.set(
    'estado_anterior',
    JSON.stringify({ titulo: antes.getString('titulo'), status: antes.getString('status') }),
  )
  entrada.set(
    'estado_novo',
    JSON.stringify({ titulo: e.record.getString('titulo'), status: e.record.getString('status') }),
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
}, 'casos')
