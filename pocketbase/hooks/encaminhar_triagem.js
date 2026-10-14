// F1-T03 · encaminhamento protegido no servidor e exceção auditada.
routerAdd(
  'POST',
  '/backend/v1/casos/{id}/encaminhar-triagem',
  (e) => {
    if (!e.auth || e.auth.getString('papel') !== 'advogado_responsavel')
      throw new ForbiddenError('Somente advogado responsável pode liberar caso para triagem.')
    const body = e.requestInfo().body || {}
    const justificativa = String(body.justificativa || '').trim()
    const caso = $app.findRecordById('casos', e.request.pathValue('id'))
    if (caso.getString('estado_operacional') === 'pronto_triagem')
      throw new BadRequestError('O caso já está pronto para triagem.')
    const pendencias = $app.findRecordsByFilter(
      'pendencias',
      'caso = {:caso} && obrigatoria = true && estado_documental != "validada"',
      '',
      1000,
      0,
      { caso: caso.id },
    )
    if (pendencias.length && !justificativa)
      throw new BadRequestError(
        'Caso bloqueado: há item obrigatório não validado; exceção exige justificativa.',
      )
    const estadoAnterior = caso.getString('estado_operacional') || 'em_documentacao'
    const actor = e.auth.id
    $app.runInTransaction((tx) => {
      caso.set('estado_operacional', 'pronto_triagem')
      if (pendencias.length) {
        caso.set('excecao_justificativa', justificativa)
        caso.set('excecao_por', actor)
      }
      tx.save(caso)
      const log = new Record($app.findCollectionByNameOrId('auditoria'))
      log.set('ator', e.auth.getString('email') + ' (advogado_responsavel)')
      log.set('acao', pendencias.length ? 'excecao_documental_e_encaminhar' : 'encaminhar_triagem')
      log.set('entidade', 'casos')
      log.set('entidade_id', caso.id)
      log.set(
        'estado_anterior',
        JSON.stringify({ estado: estadoAnterior, pendencias_obrigatorias: pendencias.length }),
      )
      log.set(
        'estado_novo',
        JSON.stringify({
          estado: 'pronto_triagem',
          justificativa: pendencias.length ? justificativa : '',
        }),
      )
      tx.save(log)
    })
    return e.json(200, {
      id: caso.id,
      estado_operacional: 'pronto_triagem',
      excecao_registrada: pendencias.length > 0,
    })
  },
  $apis.requireAuth(),
)
