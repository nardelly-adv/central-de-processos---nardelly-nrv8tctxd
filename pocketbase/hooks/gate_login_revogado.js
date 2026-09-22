// F1-T01 · RN-004 — Login negado para usuário revogado (ativo = false)
onRecordAuthWithPasswordRequest((e) => {
  if (!e.record.getBool('ativo')) {
    throw new BadRequestError('Acesso revogado. Fale com a administração.')
  }
  e.next()
}, 'users')
