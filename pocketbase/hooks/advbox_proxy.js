// ADVBOX server-side proxy com cache inteligente, fallback em rate limit (429) e suporte
// a todos os usuários autenticados da equipe compartilhada.
// Token injetado com exclusividade no backend via segredo API_ADVBOX / ADVBOX_API_TOKEN.

routerAdd(
  'POST',
  '/backend/v1/advbox',
  (e) => {
    // Permite qualquer usuário autenticado (equipe compartilhada)
    if (!e.auth) {
      throw new ForbiddenError('Autenticação necessária para consultar a API AdvBox.')
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
        cacheTtlSeconds: 180, // 3 min
      },
      createCustomer: { method: 'POST', path: '/customers', query: [], body: true },
      getCustomerById: {
        method: 'GET',
        path: '/customers/{id}',
        pathParam: 'id',
        query: [],
        cacheTtlSeconds: 300,
      },
      getCustomersBirthdays: {
        method: 'GET',
        path: '/customers/birthdays',
        query: ['month', 'limit', 'offset'],
        cacheTtlSeconds: 600, // 10 min
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
        cacheTtlSeconds: 180,
      },
      createLawsuit: { method: 'POST', path: '/lawsuits', query: [], body: true },
      getLawsuitById: {
        method: 'GET',
        path: '/lawsuits/{id}',
        pathParam: 'id',
        query: [],
        cacheTtlSeconds: 300,
      },
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
        cacheTtlSeconds: 180,
      },
      getMovementsByLawsuitId: {
        method: 'GET',
        path: '/movements/{lawsuit_id}',
        pathParam: 'lawsuit_id',
        query: ['origin'],
        cacheTtlSeconds: 180,
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
        cacheTtlSeconds: 180,
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
        cacheTtlSeconds: 180,
      },
      createPost: { method: 'POST', path: '/posts', query: [], body: true },
      getPublicationsByLawsuitId: {
        method: 'GET',
        path: '/publications/{lawsuit_id}',
        pathParam: 'lawsuit_id',
        query: [],
        cacheTtlSeconds: 180,
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
        cacheTtlSeconds: 180,
      },
      getTransactionById: {
        method: 'GET',
        path: '/transactions/{id}',
        pathParam: 'id',
        query: [],
        cacheTtlSeconds: 300,
      },
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
        cacheTtlSeconds: 180,
      },
      downloadDocument: {
        method: 'GET',
        path: '/documents/{id}/download',
        pathParam: 'id',
        query: [],
        cacheTtlSeconds: 240, // URL do S3 válida por 300s (5 min), cacheia por 4 min
      },
      getSettings: {
        method: 'GET',
        path: '/settings',
        query: [],
        cacheTtlSeconds: 900, // 15 min (dados raramente mudam)
      },
    }

    const operation = String(input.operation || '')
    if (!Object.prototype.hasOwnProperty.call(definitions, operation)) {
      throw new BadRequestError('Operação ADVBOX desconhecida: ' + operation)
    }
    const definition = definitions[operation]

    const params = input.params === undefined ? {} : input.params
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new BadRequestError('params deve ser um objeto JSON.')
    }
    const paramNames = Object.keys(params)
    let resolvedPath = definition.path
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
      resolvedPath = resolvedPath.replace(
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
      if (definition.query.indexOf(key) < 0) {
        throw new BadRequestError(
          'Parâmetro de consulta não documentado para esta operação: ' + key,
        )
      }
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

    const preferredToken = $secrets.get('API_ADVBOX') || $os.getenv('API_ADVBOX') || ''
    const fallbackToken = $secrets.get('ADVBOX_API_TOKEN') || $os.getenv('ADVBOX_API_TOKEN') || ''
    const token = String(preferredToken).trim() ? preferredToken : fallbackToken
    if (!String(token).trim()) {
      return e.json(503, {
        error:
          'Não foi possível acessar o AdvBox: configure o segredo API_ADVBOX no backend para habilitar a integração.',
        configured: false,
      })
    }

    // Montar URL e chave de cache
    let url = 'https://app.advbox.com.br/api/v1' + resolvedPath
    const sortedQueryNames = queryNames
      .filter((k) => query[k] !== null && query[k] !== undefined && String(query[k]) !== '')
      .sort()
    const queryParts = []
    for (const key of sortedQueryNames) {
      queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(query[key])))
    }
    if (queryParts.length) url += '?' + queryParts.join('&')

    // Chave de cache para requisições GET
    const isGet = definition.method === 'GET'
    const cacheKey = isGet
      ? definition.method +
        ':' +
        resolvedPath +
        (queryParts.length ? '?' + queryParts.join('&') : '')
      : ''
    const ttlSeconds = definition.cacheTtlSeconds || 180

    let cachedRecord = null
    let cachedPayload = null
    let cacheAgeSeconds = Infinity

    if (isGet) {
      try {
        cachedRecord = $app.findFirstRecordByData('advbox_cache', 'chave', cacheKey)
        if (cachedRecord) {
          const buscadoEm = cachedRecord.getDateTime('buscado_em')
          if (buscadoEm) {
            const buscadoMillis = buscadoEm.time().unix() * 1000
            cacheAgeSeconds = Math.max(0, Math.floor((Date.now() - buscadoMillis) / 1000))
          }
          const rawPayload = cachedRecord.getString('payload')
          if (rawPayload) {
            cachedPayload = JSON.parse(rawPayload)
          }

          // Se estiver fresco (dentro do TTL) e tiver dado válido, retorna do cache
          if (cacheAgeSeconds < ttlSeconds && cachedPayload !== null) {
            return e.json(200, {
              upstreamStatus: cachedRecord.getInt('status_code') || 200,
              data: cachedPayload,
              cached: true,
              cacheAgeSeconds,
            })
          }
        }
      } catch (_) {
        // Cache miss normal
      }
    }

    // Fazer requisição upstream
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
      // Se falhou transporte e temos cache (mesmo antigo), retorna cache para não quebrar a tela
      if (cachedPayload !== null) {
        $app.logger().warn('ADVBOX: falha de transporte, usando cache existente', 'key', cacheKey)
        return e.json(200, {
          upstreamStatus: cachedRecord ? cachedRecord.getInt('status_code') : 200,
          data: cachedPayload,
          cached: true,
          stale: true,
          warning: 'Exibindo dados em cache devido a oscilação temporária na API AdvBox.',
        })
      }
      return e.json(502, {
        error: 'Não foi possível acessar o AdvBox: falha de comunicação com o servidor.',
      })
    }

    // Tratar Rate Limit (429) do AdvBox: devolve o cache mais antigo disponível em vez de erro
    if (upstream.statusCode === 429) {
      if (cachedPayload !== null) {
        $app
          .logger()
          .warn('ADVBOX: rate limit (429) atingido, devolvendo cache existente', 'key', cacheKey)
        return e.json(200, {
          upstreamStatus: 200,
          data: cachedPayload,
          cached: true,
          rateLimited: true,
          warning: 'Limite de requisições do AdvBox atingido (30/min). Exibindo dados em cache.',
        })
      }
      return e.json(429, {
        error:
          'Limite de requisições por minuto da API AdvBox atingido (30 req/min). Aguarde alguns instantes e tente novamente.',
      })
    }

    // Se upstream retornar 401 ou 403: token inválido ou sem permissão
    if (upstream.statusCode === 401 || upstream.statusCode === 403) {
      return e.json(upstream.statusCode, {
        error:
          'Não foi possível acessar o AdvBox: verifique o token da API (segredo API_ADVBOX). ' +
          (upstream.statusCode === 401 ? 'Token inválido ou expirado.' : 'Acesso não autorizado.'),
        upstreamStatus: upstream.statusCode,
      })
    }

    // Parse da resposta
    let responseData = null
    if (upstream.statusCode !== 204) {
      try {
        if (typeof upstream.json !== 'undefined') {
          responseData = upstream.json
        }
      } catch (parseError) {
        responseData = null
      }
    }

    // Salvar no cache se foi sucesso (200-299) e GET
    if (isGet && upstream.statusCode >= 200 && upstream.statusCode < 300 && responseData !== null) {
      try {
        const cacheCol = $app.findCollectionByNameOrId('advbox_cache')
        let recordToSave = cachedRecord
        if (!recordToSave) {
          recordToSave = new Record(cacheCol)
          recordToSave.set('chave', cacheKey)
        }
        recordToSave.set('payload', JSON.stringify(responseData))
        recordToSave.set('buscado_em', new Date().toISOString())
        recordToSave.set('status_code', upstream.statusCode)
        $app.save(recordToSave)
      } catch (cacheErr) {
        $app.logger().warn('ADVBOX: falha ao persistir no cache', 'error', cacheErr.message)
      }
    }

    // Se status do upstream foi erro (ex: 404, 500) e temos cache anterior, devolver com fallback se apropriado
    if (upstream.statusCode >= 500 && cachedPayload !== null) {
      return e.json(200, {
        upstreamStatus: cachedRecord ? cachedRecord.getInt('status_code') : 200,
        data: cachedPayload,
        cached: true,
        stale: true,
      })
    }

    return e.json(200, { upstreamStatus: upstream.statusCode, data: responseData })
  },
  $apis.requireAuth(),
)
