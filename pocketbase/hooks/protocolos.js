// F1-T03 · protocolo de recebimento é criado apenas pela rota transacional abaixo.
// REST CRUD direto não pode produzir protocolo sem atualizar pendência e trilha.
onRecordCreateRequest((e) => {
  throw new ForbiddenError('Use a ação protegida de recebimento e protocolo.')
}, 'protocolos')

routerAdd(
  'POST',
  '/backend/v1/pendencias/{id}/protocolar',
  (e) => {
    if (!e.auth || e.auth.getString('papel') !== 'operacao_documental')
      throw new ForbiddenError('Somente a operação documental protocola recebimentos.')
    const body = e.requestInfo().body || {}
    const numero = String(body.numero || '').trim()
    const ciencia = String(body.ciencia_responsavel || '').trim()
    if (!numero) throw new BadRequestError('Número do protocolo é obrigatório.')
    if (!ciencia) throw new BadRequestError('Registre a ciência do responsável pelo caso.')
    const pendencia = $app.findRecordById('pendencias', e.request.pathValue('id'))
    if (pendencia.getString('estado_documental') !== 'solicitada')
      throw new BadRequestError('Só é possível protocolar item no estado solicitada.')
    const casoId = pendencia.getString('caso')
    const receivedBy = e.auth.id
    let protocoloId = ''
    $app.runInTransaction((tx) => {
      const protocolos = $app.findCollectionByNameOrId('protocolos')
      const protocolo = new Record(protocolos)
      protocolo.set('caso', casoId)
      protocolo.set('pendencia', pendencia.id)
      protocolo.set('numero', numero)
      protocolo.set('recebido_em', new Date().toISOString())
      protocolo.set('recebido_por', receivedBy)
      protocolo.set('ciencia_responsavel', ciencia)
      tx.save(protocolo)
      protocoloId = protocolo.id
      pendencia.set('estado_documental', 'recebida')
      pendencia.set('status', 'aberta')
      tx.save(pendencia)
      const log = new Record($app.findCollectionByNameOrId('auditoria'))
      log.set('ator', e.auth.getString('email') + ' (operacao_documental)')
      log.set('acao', 'protocolar_recebimento')
      log.set('entidade', 'protocolos')
      log.set('entidade_id', protocolo.id)
      log.set(
        'estado_novo',
        JSON.stringify({
          caso: casoId,
          pendencia: pendencia.id,
          numero,
          ciencia_responsavel: ciencia,
        }),
      )
      tx.save(log)
    })
    return e.json(201, { id: protocoloId, pendencia: pendencia.id, estado_documental: 'recebida' })
  },
  $apis.requireAuth(),
)
