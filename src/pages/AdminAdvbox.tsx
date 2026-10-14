import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ADVBOX_OPERATIONS,
  consultarStatusIntegracaoAdvbox,
  executarOperacaoAdvbox,
  type AdvboxOperation,
  type AdvboxProxyStatus,
} from '@/services/advbox'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const QUERY_FIELDS: Partial<Record<AdvboxOperation, string[]>> = {
  getCustomers: [
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
  getCustomersBirthdays: ['month', 'limit', 'offset'],
  getLawsuits: [
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
  getHistoryByLawsuitId: ['status (pending | completed)'],
  getMovementsByLawsuitId: ['origin (TRIBUNAL | MANUAL)'],
  getLastMovements: [
    'lawsuit_id',
    'process_number',
    'protocol_number',
    'date_start',
    'date_end',
    'limit',
    'offset',
  ],
  getPosts: [
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
  getTransactions: [
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
  getDocuments: ['name', 'customer_id', 'transaction_id', 'post_id', 'limit', 'offset'],
}

const REQUIRED_FIELDS: Partial<Record<AdvboxOperation, string>> = {
  createCustomer: 'users_id, customers_origins_id, name',
  createLawsuit: 'users_id, customers_id (array), stages_id, type_lawsuits_id',
  createLawsuitMovement: 'lawsuit_id, date (DD/MM/YYYY), description (mín. 10 caracteres)',
  createPost: 'from, guests (array), tasks_id, lawsuits_id, start_date',
  createTransaction:
    'users_id, entry_type, debit_account, categories_id, cost_centers_id, amount, date_due',
}

const PARAM_EXAMPLE: Record<string, string> = {
  id: '{\n  "id": 123456\n}',
  lawsuit_id: '{\n  "lawsuit_id": 123456\n}',
}

const FILTER_EXAMPLE: Partial<Record<AdvboxOperation, string>> = {
  getCustomers: '{\n  "name": "Maria",\n  "limit": 100,\n  "offset": 0\n}',
  getCustomersBirthdays: '{\n  "month": 4,\n  "limit": 1000,\n  "offset": 0\n}',
  getLawsuits: '{\n  "stage": "Instrução",\n  "limit": 100,\n  "offset": 0\n}',
  getHistoryByLawsuitId: '{\n  "status": "pending"\n}',
  getMovementsByLawsuitId: '{\n  "origin": "MANUAL"\n}',
  getLastMovements:
    '{\n  "date_start": "2026-01-01",\n  "date_end": "2026-12-31",\n  "limit": 100,\n  "offset": 0\n}',
  getPosts:
    '{\n  "created_start": "2026-01-01",\n  "created_end": "2026-12-31",\n  "limit": 100,\n  "offset": 0\n}',
  getTransactions:
    '{\n  "date_due_start": "2026-01-01",\n  "date_due_end": "2026-12-31",\n  "limit": 100,\n  "offset": 0\n}',
  getDocuments: '{\n  "customer_id": 123456,\n  "limit": 100,\n  "offset": 0\n}',
}

const BODY_EXAMPLE: Partial<Record<AdvboxOperation, string>> = {
  createCustomer:
    '{\n  "users_id": 123456,\n  "customers_origins_id": 789012,\n  "name": "Maria Silva"\n}',
  createLawsuit:
    '{\n  "users_id": "123456",\n  "customers_id": [1234567],\n  "stages_id": "2345678",\n  "type_lawsuits_id": "1234567"\n}',
  updateLawsuit: '{\n  "folder": "PASTA CLIENTE A"\n}',
  createLawsuitMovement:
    '{\n  "lawsuit_id": 123456,\n  "date": "02/04/2026",\n  "description": "Audiência de conciliação agendada"\n}',
  createPost:
    '{\n  "from": "12345",\n  "guests": [12345],\n  "tasks_id": "100",\n  "lawsuits_id": "5000",\n  "start_date": "2026-04-02"\n}',
  createTransaction:
    '{\n  "users_id": 12345,\n  "entry_type": "income",\n  "debit_account": 1001,\n  "categories_id": 100,\n  "cost_centers_id": 500,\n  "amount": "250,50",\n  "date_due": "2026-04-30"\n}',
  updateTransaction: '{\n  "amount": "250,50"\n}',
}

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2)

export default function AdminAdvbox() {
  const [status, setStatus] = useState<AdvboxProxyStatus | null>(null)
  const [statusError, setStatusError] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [selected, setSelected] = useState<AdvboxOperation>('getSettings')
  const [paramsText, setParamsText] = useState('{}')
  const [queryText, setQueryText] = useState('{}')
  const [bodyText, setBodyText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [upstreamStatus, setUpstreamStatus] = useState<number | null>(null)
  const [requestError, setRequestError] = useState('')
  const [busy, setBusy] = useState(false)

  const operation = useMemo(
    () => ADVBOX_OPERATIONS.find((item) => item.operation === selected) || ADVBOX_OPERATIONS[0],
    [selected],
  )
  const groupedOperations = useMemo(
    () =>
      ADVBOX_OPERATIONS.reduce<Record<string, typeof ADVBOX_OPERATIONS>>((groups, item) => {
        ;(groups[item.group] ||= []).push(item)
        return groups
      }, {}),
    [],
  )

  const refreshStatus = useCallback(async () => {
    setCheckingStatus(true)
    setStatusError('')
    try {
      setStatus(await consultarStatusIntegracaoAdvbox())
    } catch (error) {
      setStatusError(getErrorMessage(error))
    } finally {
      setCheckingStatus(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const changeOperation = (value: string) => {
    const next = value as AdvboxOperation
    setSelected(next)
    const nextInfo = ADVBOX_OPERATIONS.find((item) => item.operation === next)
    const paramName = nextInfo?.pathParam
    setParamsText(paramName ? PARAM_EXAMPLE[paramName] || '{}' : '{}')
    setQueryText(FILTER_EXAMPLE[next] || '{}')
    setBodyText(BODY_EXAMPLE[next] || '')
    setRequestError('')
    setResponseText('')
    setUpstreamStatus(null)
  }

  const execute = async (event: React.FormEvent) => {
    event.preventDefault()
    setRequestError('')
    setResponseText('')
    setUpstreamStatus(null)

    let params: Record<string, string | number> = {}
    let query: Record<string, string | number | boolean | null> = {}
    let body: Record<string, unknown> | undefined
    try {
      params = JSON.parse(paramsText || '{}')
      query = JSON.parse(queryText || '{}')
      if (operation.hasBody) body = JSON.parse(bodyText || '{}')
      if (!params || Array.isArray(params) || typeof params !== 'object')
        throw new Error('Parâmetros do caminho precisam ser um objeto JSON.')
      if (!query || Array.isArray(query) || typeof query !== 'object')
        throw new Error('Filtros precisam ser um objeto JSON.')
      if (operation.hasBody && (!body || Array.isArray(body) || typeof body !== 'object'))
        throw new Error('O corpo precisa ser um objeto JSON.')
      if (!operation.hasBody && paramsText.trim() !== '{}' && !operation.pathParam)
        throw new Error('Esta operação não recebe parâmetros de caminho.')
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Revise a sintaxe JSON dos campos.')
      return
    }

    setBusy(true)
    try {
      const result = await executarOperacaoAdvbox({
        operation: selected,
        ...(operation.pathParam ? { params } : {}),
        ...(operation.hasQuery ? { query } : {}),
        ...(operation.hasBody ? { body } : {}),
      })
      setUpstreamStatus(result.upstreamStatus)
      setResponseText(prettyJson(result.data))
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const queryFields = QUERY_FIELDS[selected]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-teal-700">Administração · Integrações</p>
            <h1 className="text-2xl font-semibold tracking-tight">Integração ADVBOX</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Cliente administrativo para as 22 operações documentadas da API ADVBOX. As chamadas
              são feitas pelo backend do Skip e entram na trilha de auditoria.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                  Conexão segura
                </CardTitle>
                <CardDescription className="mt-1">
                  Endpoint oficial: https://app.advbox.com.br/api/v1
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={checkingStatus}
                onClick={() => void refreshStatus()}
              >
                {checkingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Atualizar status
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkingStatus ? (
              <p role="status" className="text-sm text-muted-foreground">
                Verificando configuração…
              </p>
            ) : status?.configured ? (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Segredo ADVBOX configurado no backend. A chave não é enviada ao navegador.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Falta configurar o segredo privado <code>ADVBOX_API_TOKEN</code> no Skip Cloud.
                  Até lá, as operações não serão encaminhadas à ADVBOX.
                </span>
              </div>
            )}
            {statusError && (
              <p role="alert" className="text-sm text-red-700">
                Não foi possível consultar o status: {statusError}
              </p>
            )}
            <div className="flex items-start gap-3 rounded-md border bg-white p-3 text-sm">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
              <p>
                O backend usa o segredo <code>API_ADVBOX</code> já cadastrado em Skip Cloud →
                Secrets. Não cole o token nesta tela, no chat nem em variáveis <code>VITE_*</code>;
                o serviço só verifica se o segredo existe.
              </p>
            </div>
            <a
              className="inline-flex items-center gap-1 text-sm text-teal-800 underline"
              href="https://api.softwareadvbox.com.br/docs/autenticacao"
              target="_blank"
              rel="noreferrer"
            >
              Orientações oficiais de autenticação <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Executar operação</CardTitle>
            <CardDescription>
              A API da ADVBOX limita leituras a 30 chamadas por minuto. Escritas não são repetidas
              automaticamente, evitando duplicar cadastros, tarefas ou lançamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(event) => void execute(event)}>
              <div className="space-y-2">
                <Label htmlFor="advbox-operation">Operação documentada (22)</Label>
                <select
                  id="advbox-operation"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selected}
                  onChange={(event) => changeOperation(event.target.value)}
                >
                  {Object.entries(groupedOperations).map(([group, items]) => (
                    <optgroup label={group} key={group}>
                      {items.map((item) => (
                        <option key={item.operation} value={item.operation}>
                          {item.method} {item.endpoint} — {item.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">{operation.description}</p>
              </div>

              {operation.pathParam && (
                <div className="space-y-2">
                  <Label htmlFor="advbox-params">Parâmetro de caminho — JSON</Label>
                  <Textarea
                    id="advbox-params"
                    className="min-h-20 font-mono text-xs"
                    value={paramsText}
                    onChange={(event) => setParamsText(event.target.value)}
                    placeholder={PARAM_EXAMPLE[operation.pathParam] || '{}'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe <code>{operation.pathParam}</code> com um ID inteiro positivo da ADVBOX.
                  </p>
                </div>
              )}

              {operation.hasQuery && (
                <div className="space-y-2">
                  <Label htmlFor="advbox-query">Filtros / paginação — JSON</Label>
                  <Textarea
                    id="advbox-query"
                    className="min-h-28 font-mono text-xs"
                    value={queryText}
                    onChange={(event) => setQueryText(event.target.value)}
                    placeholder={FILTER_EXAMPLE[selected] || '{}'}
                  />
                  {queryFields && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Parâmetros documentados:{' '}
                      {queryFields.map((field) => (
                        <code key={field} className="mr-1">
                          {field}
                        </code>
                      ))}
                    </p>
                  )}
                  {selected === 'getDocuments' && (
                    <p className="text-xs text-amber-800">
                      Envie pelo menos um filtro; name deve conter ao menos 3 caracteres.
                    </p>
                  )}
                  {selected === 'getPosts' && (
                    <p className="text-xs text-amber-800">
                      Cada faixa de datas deve ser enviada com start e end.
                    </p>
                  )}
                  {selected === 'getTransactions' && (
                    <p className="text-xs text-amber-800">
                      Competência usa MM/YYYY; os demais intervalos de data usam YYYY-MM-DD.
                    </p>
                  )}
                </div>
              )}

              {operation.hasBody && (
                <div className="space-y-2">
                  <Label htmlFor="advbox-body">Corpo da requisição — JSON</Label>
                  <Textarea
                    id="advbox-body"
                    className="min-h-44 font-mono text-xs"
                    value={bodyText}
                    onChange={(event) => setBodyText(event.target.value)}
                    placeholder={BODY_EXAMPLE[selected] || '{\n  \n}'}
                  />
                  {REQUIRED_FIELDS[selected] && (
                    <p className="text-xs text-muted-foreground">
                      Campos obrigatórios documentados: {REQUIRED_FIELDS[selected]}.
                    </p>
                  )}
                  {selected === 'createCustomer' && (
                    <p className="text-xs text-amber-800">
                      CPF/CNPJ deve ser válido; CEP exige hífen; telefone celular deve trazer DDD e
                      não deve começar por +55.
                    </p>
                  )}
                  {selected === 'createLawsuit' && (
                    <p className="text-xs text-amber-800">
                      process_number é validado contra processos distribuídos; datas são YYYY-MM-DD
                      e folder aceita no máximo 30 caracteres.
                    </p>
                  )}
                  {selected === 'createLawsuitMovement' && (
                    <p className="text-xs text-amber-800">
                      A data desta operação é DD/MM/YYYY — diferente de outros endpoints que usam
                      YYYY-MM-DD.
                    </p>
                  )}
                  {selected === 'createTransaction' && (
                    <p className="text-xs text-amber-800">
                      amount usa vírgula decimal. Categoria deve corresponder a entry_type;
                      lawsuits_id exige customers_id.
                    </p>
                  )}
                  {selected === 'updateTransaction' && (
                    <p className="text-xs text-amber-800">
                      Ao alterar categories_id, envie entry_type também. Para reabrir, date_payment
                      deve ser null.
                    </p>
                  )}
                </div>
              )}

              {requestError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {requestError}
                </div>
              )}
              <Button
                type="submit"
                disabled={busy || checkingStatus || status?.configured !== true}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {busy ? 'Aguardando resposta…' : 'Executar operação'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {upstreamStatus !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resposta ADVBOX — HTTP {upstreamStatus}</CardTitle>
              <CardDescription>
                {upstreamStatus >= 200 && upstreamStatus < 300
                  ? 'A chamada foi processada pela API.'
                  : 'A ADVBOX retornou uma resposta de erro; verifique os campos e IDs da conta.'}
                {selected === 'downloadDocument' && upstreamStatus >= 200 && upstreamStatus < 300
                  ? ' A URL assinada expira em 5 minutos.'
                  : ''}
                {selected === 'createTransaction' && upstreamStatus >= 200 && upstreamStatus < 300
                  ? ' Confira a transação no sistema: a resposta da API usa um campo de ID legado.'
                  : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre
                className="max-h-[32rem] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100"
                aria-label="Resposta JSON da API ADVBOX"
              >
                {responseText || 'null'}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
