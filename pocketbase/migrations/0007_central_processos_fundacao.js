migrate(
  (app) => {
    // Usuário demo para equipe compartilhada se não existir
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'equipe@central.adv.br')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const demoUser = new Record(usersCol)
      demoUser.setEmail('equipe@central.adv.br')
      demoUser.setPassword('Central@123')
      demoUser.setVerified(true)
      demoUser.set('name', 'Advocacia Central Demo')
      demoUser.set('papel', 'advogado_responsavel')
      demoUser.set('ativo', true)
      app.save(demoUser)
    }

    // 1. Coleção clientes
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo_pessoa',
          type: 'select',
          required: true,
          values: ['fisica', 'juridica'],
          maxSelect: 1,
        },
        { name: 'cpf_cnpj', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'profissao', type: 'text' },
        {
          name: 'estado_civil',
          type: 'select',
          values: ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'],
          maxSelect: 1,
        },
        { name: 'nacionalidade', type: 'text' },
        { name: 'rg', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'estado', type: 'text' },
        { name: 'cep', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_nome ON clientes (nome)',
        'CREATE INDEX idx_clientes_cpf_cnpj ON clientes (cpf_cnpj)',
      ],
    })
    app.save(clientes)

    // 2. Coleção processos
    const processos = new Collection({
      name: 'processos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'numero_cnj', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: clientes.id,
          maxSelect: 1,
        },
        { name: 'parte_contraria', type: 'text' },
        {
          name: 'area',
          type: 'select',
          required: true,
          values: [
            'Civel',
            'Trabalhista',
            'Criminal',
            'Familia',
            'Previdenciario',
            'Tributario',
            'Consumidor',
            'Outra',
          ],
          maxSelect: 1,
        },
        { name: 'fase', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Suspenso', 'Arquivado', 'Encerrado'],
          maxSelect: 1,
        },
        { name: 'tribunal', type: 'text' },
        { name: 'vara', type: 'text' },
        { name: 'comarca', type: 'text' },
        { name: 'valor_causa', type: 'number' },
        {
          name: 'prioridade',
          type: 'select',
          values: ['Baixa', 'Media', 'Alta', 'Urgente'],
          maxSelect: 1,
        },
        { name: 'data_distribuicao', type: 'date' },
        { name: 'proximo_prazo', type: 'date' },
        { name: 'descricao_proximo_prazo', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'responsavel', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_processos_numero ON processos (numero_cnj)',
        'CREATE INDEX idx_processos_cliente ON processos (cliente)',
        'CREATE INDEX idx_processos_status ON processos (status)',
      ],
    })
    app.save(processos)

    // 3. Coleção movimentacoes (andamentos)
    const movimentacoes = new Collection({
      name: 'movimentacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'processo',
          type: 'relation',
          required: true,
          collectionId: processos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'Peticao',
            'Despacho',
            'Decisao',
            'Sentenca',
            'Audiencia',
            'Acordao',
            'Publicacao',
            'Outro',
          ],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'prazo_fatal', type: 'date' },
        { name: 'cumprido', type: 'bool' },
        { name: 'registrado_por', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_movimentacoes_processo ON movimentacoes (processo)',
        'CREATE INDEX idx_movimentacoes_data ON movimentacoes (data DESC)',
      ],
    })
    app.save(movimentacoes)

    // 4. Coleção documentos
    const documentos = new Collection({
      name: 'documentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          values: [
            'Procuracao',
            'Peticao',
            'Contrato',
            'Identidade',
            'Comprovante',
            'Sentenca_Decisao',
            'Laudo_Pericia',
            'Outro',
          ],
          maxSelect: 1,
        },
        { name: 'arquivo', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 },
        { name: 'cliente', type: 'relation', collectionId: clientes.id, maxSelect: 1 },
        { name: 'processo', type: 'relation', collectionId: processos.id, maxSelect: 1 },
        { name: 'descricao', type: 'text' },
        { name: 'tamanho_bytes', type: 'number' },
        { name: 'enviado_por', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_docs_cliente ON documentos (cliente)',
        'CREATE INDEX idx_docs_processo ON documentos (processo)',
      ],
    })
    app.save(documentos)

    // Seed de demonstração para ambiente vivo e amigável
    try {
      const c1 = new Record(clientes)
      c1.set('nome', 'Mariana Albuquerque Ramos')
      c1.set('tipo_pessoa', 'fisica')
      c1.set('cpf_cnpj', '123.456.789-00')
      c1.set('email', 'mariana.ramos@exemplo.adv.br')
      c1.set('telefone', '(11) 98765-4321')
      c1.set('whatsapp', '(11) 98765-4321')
      c1.set('profissao', 'Engenheira Civil')
      c1.set('estado_civil', 'casado')
      c1.set('cidade', 'São Paulo')
      c1.set('estado', 'SP')
      c1.set('observacoes', 'Cliente preferencial. Contato inicial via WhatsApp.')
      app.save(c1)

      const c2 = new Record(clientes)
      c2.set('nome', 'Construtora Horizonte LTDA')
      c2.set('tipo_pessoa', 'juridica')
      c2.set('cpf_cnpj', '12.345.678/0001-90')
      c2.set('email', 'juridico@horizonte.exemplo.com')
      c2.set('telefone', '(11) 3344-5566')
      c2.set('whatsapp', '(11) 97777-8888')
      c2.set('cidade', 'Campinas')
      c2.set('estado', 'SP')
      c2.set('observacoes', 'Contrato de assessoria jurídica mensal.')
      app.save(c2)

      const c3 = new Record(clientes)
      c3.set('nome', 'José Carlos Silveira')
      c3.set('tipo_pessoa', 'fisica')
      c3.set('cpf_cnpj', '987.654.321-11')
      c3.set('email', 'jose.silveira@exemplo.adv.br')
      c3.set('telefone', '(21) 99123-8899')
      c3.set('whatsapp', '(21) 99123-8899')
      c3.set('profissao', 'Aposentado')
      c3.set('estado_civil', 'viuvo')
      c3.set('cidade', 'Rio de Janeiro')
      c3.set('estado', 'RJ')
      c3.set('observacoes', 'Ação revisional previdenciária.')
      app.save(c3)

      // Processos de demonstração
      const p1 = new Record(processos)
      p1.set('numero_cnj', '5001234-88.2024.8.26.0100')
      p1.set('titulo', 'Ação Revisional Contratual e Reparação de Danos')
      p1.set('cliente', c1.id)
      p1.set('parte_contraria', 'Banco Alfa Financiamentos S/A')
      p1.set('area', 'Civel')
      p1.set('fase', 'Instrução Probatória')
      p1.set('status', 'Ativo')
      p1.set('tribunal', 'TJSP')
      p1.set('vara', '12ª Vara Cível Central')
      p1.set('comarca', 'São Paulo - Capital')
      p1.set('valor_causa', 145000)
      p1.set('prioridade', 'Alta')
      p1.set('data_distribuicao', '2024-03-15')
      p1.set('proximo_prazo', '2025-04-18')
      p1.set('descricao_proximo_prazo', 'Apresentação de réplica à contestação bancária')
      p1.set('observacoes', 'Perícia contábil já deferida pelo juízo.')
      app.save(p1)

      const p2 = new Record(processos)
      p2.set('numero_cnj', '1004567-22.2023.5.02.0045')
      p2.set('titulo', 'Reclamação Trabalhista - Horas Extras e Adicionais')
      p2.set('cliente', c2.id)
      p2.set('parte_contraria', 'Ex-colaborador João Pereira')
      p2.set('area', 'Trabalhista')
      p2.set('fase', 'Audiência de Instrução')
      p2.set('status', 'Ativo')
      p2.set('tribunal', 'TRT-2')
      p2.set('vara', '45ª Vara do Trabalho de São Paulo')
      p2.set('comarca', 'São Paulo - Capital')
      p2.set('valor_causa', 85000)
      p2.set('prioridade', 'Urgente')
      p2.set('data_distribuicao', '2023-11-20')
      p2.set('proximo_prazo', '2025-04-10')
      p2.set('descricao_proximo_prazo', 'Audiência de instrução e oitiva de testemunhas às 14h')
      p2.set('observacoes', 'Separar cartão de ponto e recibos de pagamento de diárias.')
      app.save(p2)

      const p3 = new Record(processos)
      p3.set('numero_cnj', '0023412-90.2024.4.02.5101')
      p3.set('titulo', 'Revisão da Vida Toda e Restabelecimento de Benefício')
      p3.set('cliente', c3.id)
      p3.set('parte_contraria', 'Instituto Nacional do Seguro Social - INSS')
      p3.set('area', 'Previdenciario')
      p3.set('fase', 'Aguardando Decisão do STF')
      p3.set('status', 'Suspenso')
      p3.set('tribunal', 'TRF-2')
      p3.set('vara', '3ª Vara Previdenciária Federal')
      p3.set('comarca', 'Rio de Janeiro')
      p3.set('valor_causa', 62000)
      p3.set('prioridade', 'Media')
      p3.set('data_distribuicao', '2024-01-10')
      p3.set('observacoes', 'Tema sobrestado aguardando julgamento de embargos.')
      app.save(p3)

      // Movimentações de demonstração
      const m1 = new Record(movimentacoes)
      m1.set('processo', p1.id)
      m1.set('data', '2025-03-20')
      m1.set('tipo', 'Despacho')
      m1.set('titulo', 'Intimação para réplica à contestação')
      m1.set(
        'descricao',
        'Juiz determina que a parte autora se manifeste sobre a contestação e documentos no prazo de 15 dias.',
      )
      m1.set('prazo_fatal', '2025-04-18')
      m1.set('cumprido', false)
      app.save(m1)

      const m2 = new Record(movimentacoes)
      m2.set('processo', p1.id)
      m2.set('data', '2025-02-14')
      m2.set('tipo', 'Peticao')
      m2.set('titulo', 'Contestação do Banco requerida juntada aos autos')
      m2.set('descricao', 'Instituição financeira alega regularidade das taxas praticadas.')
      m2.set('cumprido', true)
      app.save(m2)

      const m3 = new Record(movimentacoes)
      m3.set('processo', p2.id)
      m3.set('data', '2025-03-25')
      m3.set('tipo', 'Audiencia')
      m3.set('titulo', 'Designação de audiência de instrução presencial')
      m3.set(
        'descricao',
        'Audiência designada para a sala 04 do TRT-2 com oitiva das partes e 2 testemunhas.',
      )
      m3.set('prazo_fatal', '2025-04-10')
      m3.set('cumprido', false)
      app.save(m3)
    } catch (err) {
      console.log('Aviso ao semear demonstração: ' + err)
    }
  },
  (app) => {
    for (const nome of ['documentos', 'movimentacoes', 'processos', 'clientes']) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        app.delete(col)
      } catch (_) {}
    }
  },
)
