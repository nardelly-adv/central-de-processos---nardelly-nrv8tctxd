// F1-T01 · RN-005 — Autoelevação negada e auditada: nenhum usuário altera o próprio papel
onRecordUpdateRequest((e) => {
  if (e.auth && e.record.id === e.auth.id) {
    const papelAntes = e.record.original().getString('papel')
    const papelDepois = e.record.getString('papel')
    if (papelAntes !== papelDepois) {
      try {
        const trilha = $app.findCollectionByNameOrId('auditoria')
        const entrada = new Record(trilha)
        entrada.set('ator', e.auth.getString('email') + ' (' + e.auth.getString('papel') + ')')
        entrada.set('acao', 'autoelevacao_negada')
        entrada.set('entidade', 'users')
        entrada.set('entidade_id', e.record.id)
        entrada.set('estado_anterior', JSON.stringify({ papel: papelAntes }))
        entrada.set('estado_novo', JSON.stringify({ papel: papelDepois }))
        $app.save(entrada)
      } catch (_) {}
      throw new ForbiddenError('Nenhum usuário pode alterar o próprio papel (RN-005).')
    }
  }
  e.next()
}, 'users')
