// F1-T01 · RN-003/RN-004 — Auditoria: alteração de usuário (papel, ativo/revogação)
onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const papelMudou = antes.getString('papel') !== e.record.getString('papel')
  const ativoMudou = antes.getBool('ativo') !== e.record.getBool('ativo')
  if (!papelMudou && !ativoMudou) {
    e.next()
    return
  }
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const entrada = new Record(trilha)
  entrada.set(
    'ator',
    e.auth ? e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')' : 'anonimo',
  )
  entrada.set('acao', ativoMudou && !e.record.getBool('ativo') ? 'revogar' : 'alterar')
  entrada.set('entidade', 'users')
  entrada.set('entidade_id', e.record.id)
  entrada.set(
    'estado_anterior',
    JSON.stringify({ papel: antes.getString('papel'), ativo: antes.getBool('ativo') }),
  )
  entrada.set(
    'estado_novo',
    JSON.stringify({ papel: e.record.getString('papel'), ativo: e.record.getBool('ativo') }),
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
}, 'users')
