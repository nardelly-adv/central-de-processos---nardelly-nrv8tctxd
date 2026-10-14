// F1-T03 · transições e encaminhamento documental com regras de servidor.
// Rotas transacionais gravam mudança e trilha juntas; REST direto não pode contorná-las.
onRecordCreateRequest((e) => {
  if (e.record.getString('checklist_id') || e.record.getString('tipo') === 'documental')
    throw new ForbiddenError(
      'Itens documentais só podem ser criados pela ação auditada de instanciação ou devolução.',
    )
  e.next()
}, 'pendencias')

onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const documental =
    e.record.getString('tipo') === 'documental' ||
    !!e.record.getString('checklist_id') ||
    !!antes.getString('checklist_id')
  if (!documental) {
    e.next()
    return
  }
  const campos = [
    'estado_documental',
    'status',
    'obrigatoria',
    'checklist_id',
    'item_chave',
    'motivo_devolucao',
    'orientacao',
    'validada_por',
    'validada_em',
    'reenvio_de',
    'orientacao_aprovada_por',
    'orientacao_aprovada_em',
  ]
  for (const campo of campos) {
    if (String(e.record.get(campo) || '') !== String(antes.get(campo) || ''))
      throw new ForbiddenError('Use a ação documental protegida; alteração direta recusada.')
  }
  e.next()
}, 'pendencias')

onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const campos = ['estado_operacional', 'excecao_justificativa', 'excecao_por', 'checklist_atual']
  for (const campo of campos) {
    if (String(e.record.get(campo) || '') !== String(antes.get(campo) || ''))
      throw new ForbiddenError('Use a ação protegida; encaminhamento ou checklist não alterado.')
  }
  e.next()
}, 'casos')

routerAdd(
  'POST',
  '/backend/v1/pendencias/{id}/transicionar',
  (e) => {
    if (!e.auth || e.auth.getString('papel') !== 'operacao_documental')
      throw new ForbiddenError('Somente a operação documental movimenta documentos.')
    const body = e.requestInfo().body || {}
    const alvo = String(body.estado || '')
    const motivo = String(body.motivo_devolucao || '').trim()
    const orientacao = String(body.orientacao || '').trim()
    const pendencia = $app.findRecordById('pendencias', e.request.pathValue('id'))
    if (!(pendencia.getString('tipo') === 'documental' || pendencia.getString('checklist_id')))
      throw new BadRequestError('A pendência não é documental.')
    const anterior = pendencia.getString('estado_documental') || 'solicitada'
    const statusAnterior = pendencia.getString('status')
    const permitidas = {
      solicitada: ['pendente'],
      recebida: ['em_conferencia', 'devolvida', 'pendente'],
      em_conferencia: ['validada', 'devolvida', 'pendente'],
      pendente: ['solicitada'],
      devolvida: [],
      validada: [],
    }
    if (!permitidas[anterior] || !permitidas[anterior].includes(alvo))
      throw new BadRequestError(
        'Transição inválida. Recebimento exige protocolo; devolução gera novo item de reenvio.',
      )
    if (alvo === 'devolvida' && !motivo) throw new BadRequestError('Devolução exige motivo.')
    if (alvo === 'devolvida' && !pendencia.getString('orientacao').trim())
      throw new BadRequestError('Devolução exige orientação aprovada pelo advogado responsável.')
    if (alvo === 'devolvida' && !pendencia.getString('orientacao_aprovada_por'))
      throw new BadRequestError(
        'Devolução bloqueada: orientação ainda não foi aprovada pelo advogado responsável.',
      )
    const casoId = pendencia.getString('caso')
    const actor = e.auth.id
    let novaPendenciaId = ''
    $app.runInTransaction((tx) => {
      pendencia.set('estado_documental', alvo)
      pendencia.set('status', alvo === 'validada' ? 'resolvida' : 'aberta')
      if (alvo === 'devolvida') pendencia.set('motivo_devolucao', motivo)
      if (alvo === 'validada') {
        pendencia.set('validada_por', actor)
        pendencia.set('validada_em', new Date().toISOString())
      }
      tx.save(pendencia)

      const log = new Record($app.findCollectionByNameOrId('auditoria'))
      log.set('ator', e.auth.getString('email') + ' (operacao_documental)')
      log.set(
        'acao',
        alvo === 'devolvida'
          ? 'devolver_documento'
          : alvo === 'validada'
            ? 'validar_documento'
            : 'mover_estado_documental',
      )
      log.set('entidade', 'pendencias')
      log.set('entidade_id', pendencia.id)
      log.set('estado_anterior', JSON.stringify({ estado: anterior, status: statusAnterior }))
      log.set(
        'estado_novo',
        JSON.stringify({
          estado: alvo,
          motivo,
          orientacao,
          validador: alvo === 'validada' ? actor : '',
        }),
      )
      tx.save(log)

      if (alvo === 'devolvida') {
        const reenvio = new Record($app.findCollectionByNameOrId('pendencias'))
        reenvio.set('caso', casoId)
        reenvio.set('descricao', 'Reenvio solicitado — ' + pendencia.getString('descricao'))
        reenvio.set('status', 'aberta')
        reenvio.set('tipo', 'documental')
        reenvio.set('estado_documental', 'solicitada')
        reenvio.set('obrigatoria', pendencia.getBool('obrigatoria'))
        reenvio.set('checklist_id', pendencia.getString('checklist_id'))
        reenvio.set('item_chave', pendencia.getString('item_chave'))
        reenvio.set('reenvio_de', pendencia.id)
        tx.save(reenvio)
        novaPendenciaId = reenvio.id
        const auditReenvio = new Record($app.findCollectionByNameOrId('auditoria'))
        auditReenvio.set('ator', e.auth.getString('email') + ' (operacao_documental)')
        auditReenvio.set('acao', 'criar_pendencia_reenvio')
        auditReenvio.set('entidade', 'pendencias')
        auditReenvio.set('entidade_id', reenvio.id)
        auditReenvio.set(
          'estado_novo',
          JSON.stringify({
            caso: casoId,
            origem: pendencia.id,
            estado: 'solicitada',
            obrigatoria: reenvio.getBool('obrigatoria'),
          }),
        )
        tx.save(auditReenvio)
      }
    })
    return e.json(200, {
      id: pendencia.id,
      estado_documental: alvo,
      nova_pendencia_reenvio: novaPendenciaId || null,
    })
  },
  $apis.requireAuth(),
)
