// ADVBOX integration status; exposes only a boolean, never the stored credential.
routerAdd(
  'GET',
  '/backend/v1/advbox/status',
  (e) => {
    const actorRole = e.auth ? e.auth.getString('papel') : ''
    if (!e.auth || !e.auth.getBool('ativo') || actorRole !== 'administracao') {
      if (e.auth) {
        try {
          const denied = new Record($app.findCollectionByNameOrId('auditoria'))
          denied.set('ator', e.auth.id + ' (' + actorRole + ')')
          denied.set('acao', 'negacao_advbox_status')
          denied.set('entidade', 'advbox_api')
          denied.set(
            'estado_novo',
            JSON.stringify({ motivo: 'status da integração restrito à administração' }),
          )
          $app.save(denied)
        } catch (err) {
          $app
            .logger()
            .error('ADVBOX: falha ao registrar tentativa não autorizada de consulta de status')
        }
      }
      throw new ForbiddenError('A integração ADVBOX está restrita à administração.')
    }

    const preferredToken = $secrets.get('API_ADVBOX') || ''
    const fallbackToken = $secrets.get('ADVBOX_API_TOKEN') || ''
    const preferredConfigured = String(preferredToken).trim().length > 0
    return e.json(200, {
      configured: preferredConfigured || String(fallbackToken).trim().length > 0,
      secretName: preferredConfigured ? 'API_ADVBOX' : 'ADVBOX_API_TOKEN',
      baseUrl: 'https://app.advbox.com.br/api/v1',
    })
  },
  $apis.requireAuth(),
)
