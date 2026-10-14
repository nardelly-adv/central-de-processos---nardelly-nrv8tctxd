migrate(
  (app) => {
    // Criar coleção advbox_cache para cachear respostas da API AdvBox
    // Evita estouro de rate limit (30 req/min) e suporta fallback em 429
    let collection
    try {
      collection = app.findCollectionByNameOrId('advbox_cache')
    } catch (_) {
      collection = new Collection({
        name: 'advbox_cache',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'payload', type: 'json' },
          { name: 'buscado_em', type: 'date' },
          { name: 'status_code', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_advbox_cache_chave ON advbox_cache (chave)',
          'CREATE INDEX idx_advbox_cache_buscado_em ON advbox_cache (buscado_em)',
        ],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('advbox_cache')
      app.delete(collection)
    } catch (_) {}
  },
)
