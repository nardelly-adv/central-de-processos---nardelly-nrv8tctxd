// F1-T03 · RN-103/RN-104 — protocolo único e auditoria de recebimento/devolução.
onRecordCreateRequest((e) => {
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (papel !== 'operacao_documental')
    throw new ForbiddenError('Somente a operação documental protocola recebimentos.')
  const protocolos = $app.findCollectionByNameOrId('protocolos')
  const existente = $app.findRecordsByFilter('protocolos', 'pendencia = {:pendencia}', '', 1, 0, {
    pendencia: e.record.getString('pendencia'),
  })
  if (existente.length)
    throw new BadRequestError('Esta pendência já possui protocolo de recebimento.')
  if (!e.record.getString('numero').trim())
    throw new BadRequestError('Número do protocolo é obrigatório.')
  e.next()
}, 'protocolos')

onRecordAfterCreateSuccess((e) => {
  const trilha = $app.findCollectionByNameOrId('auditoria')
  const a = new Record(trilha)
  a.set(
    'ator',
    e.auth ? e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')' : 'sistema',
  )
  a.set('acao', 'protocolar_recebimento')
  a.set('entidade', 'protocolos')
  a.set('entidade_id', e.record.id)
  a.set(
    'estado_novo',
    JSON.stringify({
      caso: e.record.getString('caso'),
      pendencia: e.record.getString('pendencia'),
      numero: e.record.getString('numero'),
    }),
  )
  $app.save(a)
  e.next()
}, 'protocolos')
