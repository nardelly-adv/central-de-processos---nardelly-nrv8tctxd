// F1-T01 · RN-003 — Auditoria: definição de rota de triagem
// O gate_rotas_negacao é responsável por tentativas fora do papel; não registrar "criar"
// antes de uma requisição que será negada.
onRecordCreateRequest((e) => {
  if (!e.auth || e.auth.getString('papel') !== 'triagem_juridica') {
    e.next()
    return
  }
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const entrada = new Record(trilha)
  entrada.set('ator', e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')')
  entrada.set('acao', 'criar')
  entrada.set('entidade', 'rotas_triagem')
  entrada.set('entidade_id', e.record.id)
  entrada.set(
    'estado_novo',
    JSON.stringify({ rota: e.record.getString('rota'), caso: e.record.getString('caso') }),
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
}, 'rotas_triagem')
