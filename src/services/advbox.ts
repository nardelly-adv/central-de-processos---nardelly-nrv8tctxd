import pb from '@/lib/pocketbase/client'

export type AdvboxOperation =
  | 'getCustomers'
  | 'createCustomer'
  | 'getCustomerById'
  | 'getCustomersBirthdays'
  | 'getLawsuits'
  | 'createLawsuit'
  | 'getLawsuitById'
  | 'updateLawsuit'
  | 'getHistoryByLawsuitId'
  | 'getMovementsByLawsuitId'
  | 'createLawsuitMovement'
  | 'getLastMovements'
  | 'getPosts'
  | 'createPost'
  | 'getPublicationsByLawsuitId'
  | 'getTransactions'
  | 'getTransactionById'
  | 'createTransaction'
  | 'updateTransaction'
  | 'getDocuments'
  | 'downloadDocument'
  | 'getSettings'

export type AdvboxScalar = string | number | boolean | null
export type AdvboxQuery = Record<string, AdvboxScalar | undefined>
export type AdvboxId = number | string
export type AdvboxObject = Record<string, unknown>

export interface AdvboxProxyRequest {
  operation: AdvboxOperation
  params?: Record<string, AdvboxId>
  query?: AdvboxQuery
  body?: AdvboxObject
}

export interface AdvboxProxyResponse<T = unknown> {
  /** HTTP status returned by ADVBOX, not the local Skip proxy. */
  upstreamStatus: number
  /** Parsed JSON response, or null for a 204 / empty response. */
  data: T | null
}

export interface AdvboxProxyStatus {
  configured: boolean
  secretName: 'ADVBOX_API_TOKEN'
  baseUrl: string
}

export interface AdvboxOperationInfo {
  operation: AdvboxOperation
  group: string
  method: 'GET' | 'POST' | 'PUT'
  endpoint: string
  title: string
  description: string
  pathParam?: 'id' | 'lawsuit_id'
  hasQuery?: boolean
  hasBody?: boolean
}

/** The complete 22-operation surface documented by ADVBOX, grouped for the admin console. */
export const ADVBOX_OPERATIONS: AdvboxOperationInfo[] = [
  {
    operation: 'getCustomers',
    group: 'Contatos',
    method: 'GET',
    endpoint: '/customers',
    title: 'Listar contatos',
    description:
      'Filtros por nome, telefone, CPF/CNPJ, e-mail, cidade, estado, ocupação e datas; limite de 1.000 por página.',
    hasQuery: true,
  },
  {
    operation: 'createCustomer',
    group: 'Contatos',
    method: 'POST',
    endpoint: '/customers',
    title: 'Criar contato',
    description:
      'Exige users_id, customers_origins_id e name. Consulte GET /settings para obter IDs válidos.',
    hasBody: true,
  },
  {
    operation: 'getCustomerById',
    group: 'Contatos',
    method: 'GET',
    endpoint: '/customers/{id}',
    title: 'Consultar contato',
    description: 'Retorna os dados completos do contato e os processos associados.',
    pathParam: 'id',
  },
  {
    operation: 'getCustomersBirthdays',
    group: 'Contatos',
    method: 'GET',
    endpoint: '/customers/birthdays',
    title: 'Aniversariantes',
    description: 'Lista contatos aniversariantes; aceita month, limit e offset.',
    hasQuery: true,
  },
  {
    operation: 'getLawsuits',
    group: 'Processos',
    method: 'GET',
    endpoint: '/lawsuits',
    title: 'Listar processos',
    description:
      'Filtros por cliente, fase, tipo, responsável, números e intervalos de datas; limite de 1.000.',
    hasQuery: true,
  },
  {
    operation: 'createLawsuit',
    group: 'Processos',
    method: 'POST',
    endpoint: '/lawsuits',
    title: 'Criar processo',
    description:
      'Exige users_id, customers_id (array), stages_id e type_lawsuits_id; confira os IDs em /settings.',
    hasBody: true,
  },
  {
    operation: 'getLawsuitById',
    group: 'Processos',
    method: 'GET',
    endpoint: '/lawsuits/{id}',
    title: 'Consultar processo',
    description: 'Retorna dados do processo, clientes, fase, tipo, responsável e valores.',
    pathParam: 'id',
  },
  {
    operation: 'updateLawsuit',
    group: 'Processos',
    method: 'PUT',
    endpoint: '/lawsuits/{id}',
    title: 'Atualizar processo',
    description:
      'Envie apenas os campos que deseja alterar. Para limpar alguns campos de data, envie string vazia.',
    pathParam: 'id',
    hasBody: true,
  },
  {
    operation: 'getHistoryByLawsuitId',
    group: 'Processos',
    method: 'GET',
    endpoint: '/history/{lawsuit_id}',
    title: 'Histórico de tarefas do processo',
    description: 'Filtra por status pending ou completed; esta rota não oferece paginação.',
    pathParam: 'lawsuit_id',
    hasQuery: true,
  },
  {
    operation: 'getMovementsByLawsuitId',
    group: 'Processos',
    method: 'GET',
    endpoint: '/movements/{lawsuit_id}',
    title: 'Movimentações do processo',
    description:
      'Filtro opcional origin=TRIBUNAL ou MANUAL. Sem resultados, a API pode responder 204.',
    pathParam: 'lawsuit_id',
    hasQuery: true,
  },
  {
    operation: 'createLawsuitMovement',
    group: 'Processos',
    method: 'POST',
    endpoint: '/lawsuits/movement',
    title: 'Criar movimentação manual',
    description: 'Exige lawsuit_id, date em DD/MM/YYYY e description com pelo menos 10 caracteres.',
    hasBody: true,
  },
  {
    operation: 'getLastMovements',
    group: 'Processos',
    method: 'GET',
    endpoint: '/last_movements',
    title: 'Últimas movimentações',
    description: 'Um andamento mais recente por processo; limit padrão 100 e máximo 1.000.',
    hasQuery: true,
  },
  {
    operation: 'getPosts',
    group: 'Tarefas',
    method: 'GET',
    endpoint: '/posts',
    title: 'Listar tarefas',
    description:
      'Filtros por datas, usuários, processo e tipo de tarefa; datas de cada faixa devem ser enviadas em pares.',
    hasQuery: true,
  },
  {
    operation: 'createPost',
    group: 'Tarefas',
    method: 'POST',
    endpoint: '/posts',
    title: 'Criar tarefa',
    description:
      'Exige from, guests, tasks_id, lawsuits_id e start_date; a API detecta tarefas duplicadas.',
    hasBody: true,
  },
  {
    operation: 'getPublicationsByLawsuitId',
    group: 'Publicações',
    method: 'GET',
    endpoint: '/publications/{lawsuit_id}',
    title: 'Publicações do processo',
    description: 'Consulta publicações vinculadas ao ID do processo.',
    pathParam: 'lawsuit_id',
  },
  {
    operation: 'getTransactions',
    group: 'Financeiro',
    method: 'GET',
    endpoint: '/transactions',
    title: 'Listar transações',
    description:
      'Filtros por cliente, processo, categoria, responsável, vencimento, pagamento e competência.',
    hasQuery: true,
  },
  {
    operation: 'getTransactionById',
    group: 'Financeiro',
    method: 'GET',
    endpoint: '/transactions/{id}',
    title: 'Consultar transação',
    description: 'Retorna os detalhes financeiros completos de uma transação.',
    pathParam: 'id',
  },
  {
    operation: 'createTransaction',
    group: 'Financeiro',
    method: 'POST',
    endpoint: '/transactions',
    title: 'Criar transação',
    description:
      'Exige IDs válidos de usuário, conta, categoria e centro de custo. amount usa vírgula decimal; processos exigem customers_id.',
    hasBody: true,
  },
  {
    operation: 'updateTransaction',
    group: 'Financeiro',
    method: 'PUT',
    endpoint: '/transactions/{id}',
    title: 'Atualizar transação',
    description:
      'Ao alterar categories_id, envie entry_type junto. amount usa vírgula decimal; date_payment null deixa em aberto.',
    pathParam: 'id',
    hasBody: true,
  },
  {
    operation: 'getDocuments',
    group: 'Documentos',
    method: 'GET',
    endpoint: '/documents',
    title: 'Listar documentos',
    description:
      'Exige ao menos um filtro: name (mín. 3 caracteres), customer_id, transaction_id ou post_id.',
    hasQuery: true,
  },
  {
    operation: 'downloadDocument',
    group: 'Documentos',
    method: 'GET',
    endpoint: '/documents/{id}/download',
    title: 'URL temporária de download',
    description: 'Retorna uma URL assinada do S3 que expira em 300 segundos.',
    pathParam: 'id',
  },
  {
    operation: 'getSettings',
    group: 'Configurações',
    method: 'GET',
    endpoint: '/settings',
    title: 'Consultar configurações e IDs',
    description:
      'Consulte primeiro: usuários, origens, tarefas, fases, tipos de processo e dados financeiros da conta.',
  },
]

export type AdvboxPage<T = AdvboxObject> = {
  offset?: number
  limit?: number
  totalCount?: number
  data: T[]
  query?: AdvboxObject
}

export interface AdvboxSettings {
  users?: Array<{ id: number; name: string; email?: string; cellphone?: string }>
  origins?: Array<{ id: number; origin: string }>
  tasks?: Array<{ id: number; task: string; reward?: number }>
  stages?: Array<{ id: number; stage: string; step?: string }>
  lawsuit_types?: Array<{ id: number; type: string; group?: string }>
  financial?: {
    banks?: Array<{ id: number; name: string; institution?: string }>
    categories?: Array<{ id: number; category: string; type: string }>
    cost_centers?: Array<{ id: number; cost_center: string }>
    departments?: Array<{ id: number; department: string }>
  }
}

export interface CustomerCreateInput extends AdvboxObject {
  users_id: number
  customers_origins_id: number
  name: string
  email?: string
  document?: string
  identification?: string
  phone?: string
  cellphone?: string
  birthdate?: string
  occupation?: string
  postalcode?: string
  city?: string
  state?: string
  notes?: string
  gender?: string
  street?: string
  region?: string
  country?: string
  number_ctps?: string
  number_pis?: string
  number_cid?: string
}

export interface LawsuitCreateInput extends AdvboxObject {
  users_id: AdvboxId
  customers_id: number[]
  stages_id: AdvboxId
  type_lawsuits_id: AdvboxId
  process_number?: string
  protocol_number?: string
  folder?: string
  date?: string
  notes?: string
  fees_expec?: number
  fees_money?: number
  contingency?: number
  status_closure?: string
  exit_production?: string
  exit_execution?: string
}

export interface LawsuitUpdateInput extends AdvboxObject {
  users_id?: AdvboxId
  stages_id?: AdvboxId
  type_lawsuits_id?: AdvboxId
  process_number?: string
  protocol_number?: string
  folder?: string
  date?: string
  notes?: string
  fees_expec?: number
  fees_money?: number
  contingency?: number
  status_closure?: string
  exit_production?: string
  exit_execution?: string
}

export interface ManualMovementInput extends AdvboxObject {
  lawsuit_id: number
  date: string
  description: string
}

export interface TransactionUpdateInput extends AdvboxObject {
  entry_type?: 'income' | 'expense'
  categories_id?: number
  amount?: string | number
  date_due?: string
  date_payment?: string | null
  description?: string
  competence?: string
}

export interface PostCreateInput extends AdvboxObject {
  from: AdvboxId
  guests: number[]
  tasks_id: AdvboxId
  lawsuits_id: AdvboxId
  start_date: string
  start_time?: string
  end_date?: string
  end_time?: string
  date_deadline?: string
  local?: string
  comments?: string
  urgent?: boolean
  important?: boolean
  display_schedule?: boolean
}

export interface TransactionCreateInput extends AdvboxObject {
  users_id: number
  entry_type: 'income' | 'expense'
  debit_account: number
  categories_id: number
  cost_centers_id: number
  amount: string | number
  date_due: string
  customers_id?: number
  lawsuits_id?: number
  sectors_id?: number
  description?: string
  date_payment?: string
}

/** Calls the authenticated Skip Cloud proxy; ADVBOX credentials never reach the browser. */
export function executarOperacaoAdvbox<T = unknown>(
  request: AdvboxProxyRequest,
): Promise<AdvboxProxyResponse<T>> {
  return pb.send<AdvboxProxyResponse<T>>('/backend/v1/advbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export const consultarStatusIntegracaoAdvbox = () =>
  pb.send<AdvboxProxyStatus>('/backend/v1/advbox/status', { method: 'GET' })

export const obterConfiguracoesAdvbox = () =>
  executarOperacaoAdvbox<AdvboxSettings>({ operation: 'getSettings' })

export const listarContatosAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getCustomers', query })
export const criarContatoAdvbox = (body: CustomerCreateInput) =>
  executarOperacaoAdvbox<{ success: boolean; customers_id: number }>({
    operation: 'createCustomer',
    body,
  })
export const obterContatoAdvbox = (id: AdvboxId) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'getCustomerById', params: { id } })
export const listarAniversariantesAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getCustomersBirthdays', query })

export const listarProcessosAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getLawsuits', query })
export const criarProcessoAdvbox = (body: LawsuitCreateInput) =>
  executarOperacaoAdvbox<{ success: boolean; lawsuits_id: number }>({
    operation: 'createLawsuit',
    body,
  })
export const obterProcessoAdvbox = (id: AdvboxId) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'getLawsuitById', params: { id } })
export const atualizarProcessoAdvbox = (id: AdvboxId, body: LawsuitUpdateInput) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'updateLawsuit', params: { id }, body })
export const obterHistoricoProcessoAdvbox = (lawsuitId: AdvboxId, query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxObject>({
    operation: 'getHistoryByLawsuitId',
    params: { lawsuit_id: lawsuitId },
    query,
  })
export const listarMovimentacoesAdvbox = (lawsuitId: AdvboxId, query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage | null>({
    operation: 'getMovementsByLawsuitId',
    params: { lawsuit_id: lawsuitId },
    query,
  })
export const criarMovimentacaoAdvbox = (body: ManualMovementInput) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'createLawsuitMovement', body })
export const listarUltimasMovimentacoesAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getLastMovements', query })

export const listarTarefasAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getPosts', query })
export const criarTarefaAdvbox = (body: PostCreateInput) =>
  executarOperacaoAdvbox<{ success: boolean; posts_id: number }>({ operation: 'createPost', body })
export const listarPublicacoesProcessoAdvbox = (lawsuitId: AdvboxId) =>
  executarOperacaoAdvbox<AdvboxPage>({
    operation: 'getPublicationsByLawsuitId',
    params: { lawsuit_id: lawsuitId },
  })

export const listarTransacoesAdvbox = (query: AdvboxQuery = {}) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getTransactions', query })
export const obterTransacaoAdvbox = (id: AdvboxId) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'getTransactionById', params: { id } })
export const criarTransacaoAdvbox = (body: TransactionCreateInput) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'createTransaction', body })
export const atualizarTransacaoAdvbox = (id: AdvboxId, body: TransactionUpdateInput) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'updateTransaction', params: { id }, body })

export const listarDocumentosAdvbox = (query: AdvboxQuery) =>
  executarOperacaoAdvbox<AdvboxPage>({ operation: 'getDocuments', query })
export const obterDownloadDocumentoAdvbox = (id: AdvboxId) =>
  executarOperacaoAdvbox<AdvboxObject>({ operation: 'downloadDocument', params: { id } })
