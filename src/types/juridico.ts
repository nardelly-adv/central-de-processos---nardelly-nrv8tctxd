export type TipoPessoa = 'fisica' | 'juridica'
export type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'

export interface Cliente {
  id: string
  nome: string
  tipo_pessoa: TipoPessoa
  cpf_cnpj?: string
  email?: string
  telefone?: string
  whatsapp?: string
  profissao?: string
  estado_civil?: EstadoCivil
  nacionalidade?: string
  rg?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
  created: string
  updated: string
}

export type AreaDireito =
  | 'Civel'
  | 'Trabalhista'
  | 'Criminal'
  | 'Familia'
  | 'Previdenciario'
  | 'Tributario'
  | 'Consumidor'
  | 'Outra'

export type StatusProcesso = 'Ativo' | 'Suspenso' | 'Arquivado' | 'Encerrado'
export type PrioridadeProcesso = 'Baixa' | 'Media' | 'Alta' | 'Urgente'

export interface Processo {
  id: string
  numero_cnj: string
  titulo: string
  cliente: string
  parte_contraria?: string
  area: AreaDireito
  fase?: string
  status: StatusProcesso
  tribunal?: string
  vara?: string
  comarca?: string
  valor_causa?: number
  prioridade?: PrioridadeProcesso
  data_distribuicao?: string
  proximo_prazo?: string
  descricao_proximo_prazo?: string
  observacoes?: string
  responsavel?: string
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
    responsavel?: { id: string; name: string; email: string }
  }
}

export type TipoMovimentacao =
  | 'Peticao'
  | 'Despacho'
  | 'Decisao'
  | 'Sentenca'
  | 'Audiencia'
  | 'Acordao'
  | 'Publicacao'
  | 'Outro'

export interface Movimentacao {
  id: string
  processo: string
  data: string
  tipo: TipoMovimentacao
  titulo: string
  descricao?: string
  prazo_fatal?: string
  cumprido?: boolean
  registrado_por?: string
  created: string
  updated: string
  expand?: {
    processo?: Processo
    registrado_por?: { id: string; name: string; email: string }
  }
}

export type CategoriaDocumento =
  | 'Procuracao'
  | 'Peticao'
  | 'Contrato'
  | 'Identidade'
  | 'Comprovante'
  | 'Sentenca_Decisao'
  | 'Laudo_Pericia'
  | 'Outro'

export interface Documento {
  id: string
  nome: string
  categoria?: CategoriaDocumento
  arquivo: string
  cliente?: string
  processo?: string
  descricao?: string
  tamanho_bytes?: number
  enviado_por?: string
  created: string
  updated: string
  expand?: {
    cliente?: Cliente
    processo?: Processo
    enviado_por?: { id: string; name: string; email: string }
  }
}
