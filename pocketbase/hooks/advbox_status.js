// ADVBOX integration status; exposes boolean and settings availability to any authenticated user.
routerAdd(
  'GET',
  '/backend/v1/advbox/status',
  (e) => {
    // Acesso permitido a todos os usuários autenticados da equipe compartilhada
    if (!e.auth) {
      throw new ForbiddenError('Autenticação necessária.')
    }

    const preferredToken = $secrets.get('API_ADVBOX') || ''
    const fallbackToken = $secrets.get('ADVBOX_API_TOKEN') || ''
    const preferredConfigured = String(preferredToken).trim().length > 0
    const configured = preferredConfigured || String(fallbackToken).trim().length > 0

    return e.json(200, {
      configured,
      secretName: preferredConfigured ? 'API_ADVBOX' : 'ADVBOX_API_TOKEN',
      baseUrl: 'https://app.advbox.com.br/api/v1',
    })
  },
  $apis.requireAuth(),
)
