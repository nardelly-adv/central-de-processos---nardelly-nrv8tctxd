// F1-T03 · RN-104/RN-105 — transições documentais e bloqueio de avanço.
const estados = ['solicitada', 'recebida', 'em_conferencia', 'validada', 'devolvida', 'pendente']
const permitidas = {
  solicitada: ['recebida', 'pendente'],
  recebida: ['em_conferencia', 'devolvida', 'pendente'],
  em_conferencia: ['validada', 'devolvida', 'pendente'],
  devolvida: ['solicitada', 'recebida'],
  pendente: ['solicitada', 'recebida'],
  validada: [],
}
onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const anterior = antes.getString('estado_documental') || 'solicitada'
  const novo = e.record.getString('estado_documental') || anterior
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (!estados.includes(novo) || !permitidas[anterior]?.includes(novo)) {
    if (novo !== anterior) throw new BadRequestError('Transição documental inválida.')
  }
  if (
    novo !== anterior &&
    !['operacao_documental', 'advogado_responsavel', 'supervisao'].includes(papel)
  ) {
    throw new ForbiddenError('Somente a operação documental pode movimentar documentos.')
  }
  if (novo === 'devolvida' && !e.record.getString('motivo_devolucao').trim()) {
    throw new BadRequestError('Devolução exige motivo.')
  }
  if (novo === 'devolvida' && !e.record.getString('orientacao').trim()) {
    throw new BadRequestError('Devolução exige orientação.')
  }
  e.next()
}, 'pendencias')

onRecordUpdateRequest((e) => {
  const novo = e.record.getString('estado_operacional')
  if (novo !== 'pronto_triagem') {
    e.next()
    return
  }
  const caso = e.record.id
  const lista = $app.findRecordsByFilter(
    'pendencias',
    'caso = {:caso} && obrigatoria = true && estado_documental != "validada"',
    '',
    100,
    0,
    { caso },
  )
  const justificativa = e.record.getString('excecao_justificativa').trim()
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (lista.length && !(justificativa && papel === 'advogado_responsavel')) {
    throw new BadRequestError(
      'Caso bloqueado: há pendência documental obrigatória. Exceção do advogado exige justificativa.',
    )
  }
  e.next()
}, 'casos')
