import React from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  titulo: string
  descricao: string
  acaoTexto?: string
  onAcao?: () => void
}

export function EmptyState({ icon, titulo, descricao, acaoTexto, onAcao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-4">
      {icon && (
        <div className="mb-4 text-slate-400 p-3 bg-white rounded-full shadow-sm">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mb-5">{descricao}</p>
      {acaoTexto && onAcao && (
        <Button onClick={onAcao} className="bg-teal-700 hover:bg-teal-800 text-white">
          {acaoTexto}
        </Button>
      )}
    </div>
  )
}
