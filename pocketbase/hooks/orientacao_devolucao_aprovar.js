// F1-T03 · orientação de devolução só é liberada após aprovação do advogado responsável.
routerAdd(
  'POST',
  '/backend/v1/pendencias/{id}/aprovar-orientacao',
  (e) => {
    if (!e.auth || e.auth.getString('papel') !== 'advogado_responsavel')
      throw new ForbiddenError('Somente advogado responsável aprova orientação de devolução.')
    const body = e.requestInfo().body || {}
    const orientacao = String(body.orientacao || '').trim()
    if (!orientacao) throw new BadRequestError('A orientação aprovada não pode ficar vazia.')
    const pendencia = $app.findRecordById('pendencias', e.request.pathValue('id'))
    if (!(pendencia.getString('tipo') === 'documental' || pendencia.getString('checklist_id')))
      throw new BadRequestError('A pendência não é documental.')
    const anterior = pendencia.getString('orientacao')
    const actor = e.auth.id
    const agora = new Date().toISOString()
    $app.runInTransaction((tx) => {
      pendencia.set('orientacao', orientacao)
      pendencia.set('orientacao_aprovada_por', actor)
      pendencia.set('orientacao_aprovada_em', agora)
      tx.save(pendencia)
      const log = new Record($app.findCollectionByNameOrId('auditoria'))
      log.set('ator', e.auth.getString('email') + ' (advogado_responsavel)')
      log.set('acao', 'aprovar_orientacao_devolucao')
      log.set('entidade', 'pendencias')
      log.set('entidade_id', pendencia.id)
      log.set(
        'estado_anterior',
        JSON.stringify({
          orientacao: anterior,
          aprovada: !!pendencia.original().getString('orientacao_aprovada_por'),
        }),
      )
      log.set('estado_novo', JSON.stringify({ orientacao, aprovador: actor, aprovada_em: agora }))
      tx.save(log)
    })
    return e.json(200, { id: pendencia.id, orientacao_aprovada: true })
  },
  $apis.requireAuth(),
)
