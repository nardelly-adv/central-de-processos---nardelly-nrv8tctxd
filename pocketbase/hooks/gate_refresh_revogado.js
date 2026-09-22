// F1-T01 · RN-004 — Renovação de sessão negada para usuário revogado
onRecordAuthRefreshRequest((e) => {
  if (!e.record.getBool('ativo')) {
    throw new ForbiddenError('Sessão revogada.')
  }
  e.next()
}, 'users')
