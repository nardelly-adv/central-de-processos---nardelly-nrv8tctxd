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
    const estadoInicial = pendencia.getString('estado_documental')
    if (estadoInicial !== 'recebida' && estadoInicial !== 'em_conferencia') {
      throw new BadRequestError(
        'Aprovação de orientação permitida apenas quando o estado documental for recebida ou em conferência.',
      )
    }
    if (pendencia.getString('orientacao_aprovada_por')) {
      throw new BadRequestError('Orientação já aprovada; não pode ser sobrescrita.')
    }

    $app.runInTransaction((tx) => {
      const reloaded = tx.findRecordById('pendencias', pendencia.id)
      const estadoDocTx = reloaded.getString('estado_documental')
      if (estadoDocTx !== 'recebida' && estadoDocTx !== 'em_conferencia') {
        throw new BadRequestError(
          'Aprovação de orientação permitida apenas quando o estado documental for recebida ou em conferência.',
        )
      }
      if (reloaded.getString('orientacao_aprovada_por')) {
        throw new BadRequestError('Orientação já aprovada; não pode ser sobrescrita.')
      }

      const res = tx
        .db()
        .newQuery(
          "UPDATE pendencias SET orientacao = {:orientacao}, orientacao_aprovada_por = {:actor}, orientacao_aprovada_em = {:agora}, updated = {:agora} WHERE id = {:id} AND (orientacao_aprovada_por = '' OR orientacao_aprovada_por IS NULL) AND estado_documental IN ('recebida', 'em_conferencia')",
        )
        .bind({
          id: pendencia.id,
          orientacao: orientacao,
          actor: actor,
          agora: agora,
        })
        .execute()

      if (res.rowsAffected() === 0) {
        throw new BadRequestError(
          'Orientação já aprovada ou estado documental não elegível; alteração recusada.',
        )
      }

      const log = new Record(tx.findCollectionByNameOrId('auditoria'))
      log.set('ator', e.auth.getString('email') + ' (advogado_responsavel)')
      log.set('acao', 'aprovar_orientacao_devolucao')
      log.set('entidade', 'pendencias')
      log.set('entidade_id', pendencia.id)
      log.set(
        'estado_anterior',
        JSON.stringify({
          orientacao: anterior,
          aprovada: false,
        }),
      )
      log.set('estado_novo', JSON.stringify({ orientacao, aprovador: actor, aprovada_em: agora }))
      tx.save(log)
    })
    return e.json(200, { id: pendencia.id, orientacao_aprovada: true })
  },
  $apis.requireAuth(),
)
