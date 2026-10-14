// ADVBOX server-side proxy. One routerAdd per hook file, per Skip Cloud runtime rules.
// API credentials are held only in Skip Cloud Secret ADVBOX_API_TOKEN.
routerAdd(
  'POST',
  '/backend/v1/advbox',
  (e) => {
    const actorRole = e.auth ? e.auth.getString('papel') : ''
    if (!e.auth || !e.auth.getBool('ativo') || actorRole !== 'administracao') {
      if (e.auth) {
        try {
          const denied = new Record($app.findCollectionByNameOrId('auditoria'))
          denied.set('ator', e.auth.id + ' (' + actorRole + ')')
          denied.set('acao', 'negacao_advbox')
          denied.set('entidade', 'advbox_api')
          denied.set(
            'estado_novo',
            JSON.stringify({ motivo: 'integração ADVBOX restrita à administração' }),
          )
          $app.save(denied)
        } catch (err) {
          $app.logger().error('ADVBOX: falha ao registrar tentativa não autorizada')
        }
      }
      throw new ForbiddenError('A integração ADVBOX está restrita à administração.')
    }

    const input = e.requestInfo().body || {}
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestError('Envie um objeto JSON com a operação da API ADVBOX.')
    }

    const definitions = {
      getCustomers: {
        method: 'GET',
        path: '/customers',
        query: [
          'name',
          'phone',
          'identification',
          'document',
          'email',
          'city',
          'state',
          'occupation',
          'birthdays',
          'created_start',
          'created_end',
          'limit',
          'offset',
        ],
      },
      createCustomer: { method: 'POST', path: '/customers', query: [], body: true },
      getCustomerById: { method: 'GET', path: '/customers/{id}', pathParam: 'id', query: [] },
      getCustomersBirthdays: {
        method: 'GET',
        path: '/customers/birthdays',
        query: ['month', 'limit', 'offset'],
      },
      getLawsuits: {
        method: 'GET',
        path: '/lawsuits',
        query: [
          'name',
          'customer_id',
          'identification',
          'process_number',
          'protocol_number',
          'folder',
          'notes',
          'group',
          'type',
          'responsible',
          'stage',
          'step',
          'process_date_start',
          'process_date_end',
          'status_closure_start',
          'status_closure_end',
          'exit_production_start',
          'exit_production_end',
          'exit_execution_start',
          'exit_execution_end',
          'created_start',
          'created_end',
          'limit',
          'offset',
        ],
      },
      createLawsuit: { method: 'POST', path: '/lawsuits', query: [], body: true },
      getLawsuitById: { method: 'GET', path: '/lawsuits/{id}', pathParam: 'id', query: [] },
      updateLawsuit: {
        method: 'PUT',
        path: '/lawsuits/{id}',
        pathParam: 'id',
        query: [],
        body: true,
      },
      getHistoryByLawsuitId: {
        method: 'GET',
        path: '/history/{lawsuit_id}',
        pathParam: 'lawsuit_id',
        query: ['status'],
      },
      getMovementsByLawsuitId: {
        method: 'GET',
        path: '/movements/{lawsuit_id}',
        pathParam: 'lawsuit_id',
        query: ['origin'],
      },
      createLawsuitMovement: { method: 'POST', path: '/lawsuits/movement', query: [], body: true },
      getLastMovements: {
        method: 'GET',
        path: '/last_movements',
        query: [
          'lawsuit_id',
          'process_number',
          'protocol_number',
          'date_start',
          'date_end',
          'limit',
          'offset',
        ],
      },
      getPosts: {
        method: 'GET',
        path: '/posts',
        query: [
          'date_start',
          'date_end',
          'created_start',
          'created_end',
          'deadline_start',
          'deadline_end',
          'completed_start',
          'completed_end',
          'user_id',
          'user_name',
          'task_id',
          'id',
          'lawsuit_id',
          'limit',
          'offset',
        ],
      },
      createPost: { method: 'POST', path: '/posts', query: [], body: true },
      getPublicationsByLawsuitId: {
        method: 'GET',
        path: '/publications/{lawsuit_id}',
        pathParam: 'lawsuit_id',
        query: [],
      },
      getTransactions: {
        method: 'GET',
        path: '/transactions',
        query: [
          'lawsuit_id',
          'category',
          'responsible',
          'customer_name',
          'debit_bank',
          'cost_center',
          'description',
          'process_number',
          'protocol_number',
          'customer_identification',
          'created_start',
          'created_end',
          'date_due_start',
          'date_due_end',
          'date_payment_start',
          'date_payment_end',
          'competence_start',
          'competence_end',
          'limit',
          'offset',
        ],
      },
      getTransactionById: { method: 'GET', path: '/transactions/{id}', pathParam: 'id', query: [] },
      createTransaction: { method: 'POST', path: '/transactions', query: [], body: true },
      updateTransaction: {
        method: 'PUT',
        path: '/transactions/{id}',
        pathParam: 'id',
        query: [],
        body: true,
      },
      getDocuments: {
        method: 'GET',
        path: '/documents',
        query: ['name', 'customer_id', 'transaction_id', 'post_id', 'limit', 'offset'],
      },
      downloadDocument: {
        method: 'GET',
        path: '/documents/{id}/download',
        pathParam: 'id',
        query: [],
      },
      getSettings: { method: 'GET', path: '/settings', query: [] },
    }

    const operation = String(input.operation || '')
    if (!Object.prototype.hasOwnProperty.call(definitions, operation)) {
      throw new BadRequestError('Operação ADVBOX desconhecida. Consulte o catálogo do cliente.')
    }
    const definition = definitions[operation]

    const params = input.params === undefined ? {} : input.params
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new BadRequestError('params deve ser um objeto JSON.')
    }
    const paramNames = Object.keys(params)
    if (definition.pathParam) {
      if (paramNames.length !== 1 || paramNames[0] !== definition.pathParam) {
        throw new BadRequestError(
          'Informe somente o parâmetro ' + definition.pathParam + ' para esta operação.',
        )
      }
      const pathValue = String(params[definition.pathParam] || '')
      if (!/^\d+$/.test(pathValue) || Number(pathValue) < 1) {
        throw new BadRequestError('O ID do recurso deve ser um inteiro positivo.')
      }
      definition.path = definition.path.replace(
        '{' + definition.pathParam + '}',
        encodeURIComponent(pathValue),
      )
    } else if (paramNames.length) {
      throw new BadRequestError('Esta operação não aceita parâmetros de caminho.')
    }

    const query = input.query === undefined ? {} : input.query
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
      throw new BadRequestError('query deve ser um objeto JSON com parâmetros documentados.')
    }
    const queryNames = Object.keys(query)
    for (const key of queryNames) {
      if (definition.query.indexOf(key) < 0)
        throw new BadRequestError(
          'Parâmetro de consulta não documentado para esta operação: ' + key,
        )
      const value = query[key]
      if (
        value !== null &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        throw new BadRequestError(
          'Os valores dos parâmetros de consulta devem ser texto, número ou booleano.',
        )
      }
    }

    const hasBody = input.body !== undefined
    if (definition.body && !hasBody) throw new BadRequestError('Esta operação exige body JSON.')
    if (hasBody && (!input.body || typeof input.body !== 'object' || Array.isArray(input.body))) {
      throw new BadRequestError('body deve ser um objeto JSON.')
    }
    if (hasBody && Object.keys(input.body).length === 0) {
      throw new BadRequestError(
        'Informe ao menos um campo em body; escritas vazias não são executadas.',
      )
    }
    if (!definition.body && hasBody) throw new BadRequestError('Esta operação não aceita body.')

    const token = $secrets.get('ADVBOX_API_TOKEN') || ''
    if (!String(token).trim()) {
      return e.json(503, {
        error: 'O segredo ADVBOX_API_TOKEN ainda não foi configurado no Skip Cloud.',
      })
    }

    let url = 'https://app.advbox.com.br/api/v1' + definition.path
    const queryParts = []
    for (const key of queryNames) {
      const value = query[key]
      if (value === null || value === undefined || String(value) === '') continue
      queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    }
    if (queryParts.length) url += '?' + queryParts.join('&')

    const audit = new Record($app.findCollectionByNameOrId('auditoria'))
    audit.set('ator', e.auth.id + ' (administracao)')
    audit.set('acao', 'advbox_request_started')
    audit.set('entidade', 'advbox_api')
    audit.set('entidade_id', operation)
    audit.set(
      'estado_novo',
      JSON.stringify({ operation, method: definition.method, endpoint: definition.path }),
    )
    try {
      $app.save(audit)
    } catch (err) {
      $app
        .logger()
        .error(
          'ADVBOX: operação bloqueada porque não foi possível registrar a auditoria',
          'operation',
          operation,
        )
      return e.json(500, {
        error: 'Operação bloqueada: não foi possível registrar a trilha de auditoria.',
      })
    }

    let upstream
    try {
      const headers = { Accept: 'application/json', Authorization: 'Bearer ' + token }
      const upstreamRequest = {
        url,
        method: definition.method,
        headers,
        timeout: 30,
      }
      if (hasBody) {
        headers['Content-Type'] = 'application/json'
        upstreamRequest.body = JSON.stringify(input.body)
      }
      upstream = $http.send(upstreamRequest)
    } catch (err) {
      const errorId = String(Date.now()) + '-' + String(Math.floor(Math.random() * 1000000))
      $app.logger().error('ADVBOX: falha de transporte', 'errorId', errorId, 'operation', operation)
      try {
        const outcome = new Record($app.findCollectionByNameOrId('auditoria'))
        outcome.set('ator', e.auth.id + ' (administracao)')
        outcome.set('acao', 'advbox_transport_error')
        outcome.set('entidade', 'advbox_api')
        outcome.set('entidade_id', operation)
        outcome.set('estado_novo', JSON.stringify({ operation, errorId }))
        $app.save(outcome)
      } catch (auditError) {
        $app
          .logger()
          .error(
            'ADVBOX: falha ao registrar o resultado de transporte',
            'errorId',
            errorId,
            'operation',
            operation,
          )
      }
      return e.json(502, { error: 'Falha de comunicação com a API ADVBOX.', errorId })
    }

    let responseData = null
    if (upstream.statusCode !== 204) {
      try {
        if (typeof upstream.json !== 'undefined') responseData = upstream.json
      } catch (parseError) {
        responseData = null
      }
    }
    try {
      const outcome = new Record($app.findCollectionByNameOrId('auditoria'))
      outcome.set('ator', e.auth.id + ' (administracao)')
      outcome.set(
        'acao',
        upstream.statusCode >= 200 && upstream.statusCode < 400
          ? 'advbox_response_received'
          : 'advbox_upstream_error',
      )
      outcome.set('entidade', 'advbox_api')
      outcome.set('entidade_id', operation)
      outcome.set(
        'estado_novo',
        JSON.stringify({ operation, upstream_status: upstream.statusCode }),
      )
      $app.save(outcome)
    } catch (auditError) {
      $app
        .logger()
        .error(
          'ADVBOX: resposta recebida, mas não foi possível registrar o resultado na auditoria',
          'operation',
          operation,
          'upstream_status',
          upstream.statusCode,
        )
    }

    return e.json(200, { upstreamStatus: upstream.statusCode, data: responseData })
  },
  $apis.requireAuth(),
)
