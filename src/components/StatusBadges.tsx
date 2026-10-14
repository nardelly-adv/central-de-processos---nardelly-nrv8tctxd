import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { StatusProcesso, AreaDireito, PrioridadeProcesso } from '@/types/juridico'

export function StatusBadge({ status }: { status?: StatusProcesso | string }) {
  if (!status) return null

  switch (status) {
    case 'Ativo':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300 font-medium">
          ● Ativo
        </Badge>
      )
    case 'Suspenso':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 font-medium">
          ❚❚ Suspenso
        </Badge>
      )
    case 'Arquivado':
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 font-medium">
          Arquivado
        </Badge>
      )
    case 'Encerrado':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 font-medium">
          Encerrado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function AreaBadge({ area }: { area?: AreaDireito | string }) {
  if (!area) return null

  const colorMap: Record<string, string> = {
    Civel: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Trabalhista: 'bg-amber-50 text-amber-800 border-amber-200',
    Criminal: 'bg-rose-50 text-rose-700 border-rose-200',
    Familia: 'bg-purple-50 text-purple-700 border-purple-200',
    Previdenciario: 'bg-teal-50 text-teal-800 border-teal-200',
    Tributario: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    Consumidor: 'bg-orange-50 text-orange-800 border-orange-200',
  }

  const cls = colorMap[area] || 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <Badge variant="outline" className={`${cls} font-normal text-xs`}>
      {area}
    </Badge>
  )
}

export function PrioridadeBadge({ prioridade }: { prioridade?: PrioridadeProcesso | string }) {
  if (!prioridade) return null

  switch (prioridade) {
    case 'Urgente':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
          Urgente
        </span>
      )
    case 'Alta':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          Alta
        </span>
      )
    case 'Media':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          Média
        </span>
      )
    case 'Baixa':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          Baixa
        </span>
      )
    default:
      return null
  }
}
