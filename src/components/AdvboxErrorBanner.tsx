import { AlertTriangle, KeyRound, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdvboxErrorBannerProps {
  mensagem?: string
  status?: number
  onTentarNovamente?: () => void
  recarregando?: boolean
}

export function AdvboxErrorBanner({
  mensagem,
  status,
  onTentarNovamente,
  recarregando = false,
}: AdvboxErrorBannerProps) {
  const isAuthError =
    status === 401 || status === 403 || (mensagem && mensagem.toLowerCase().includes('token'))

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            {isAuthError ? (
              <KeyRound className="h-5 w-5 text-amber-700" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-amber-950">
              {isAuthError
                ? 'Conexão com AdvBox requer verificação do token'
                : 'Aviso de comunicação com a API AdvBox'}
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              {mensagem ||
                'Não foi possível obter resposta em tempo real da API AdvBox. Revise o segredo API_ADVBOX no Skip Cloud.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onTentarNovamente && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTentarNovamente}
              disabled={recarregando}
              className="h-8 border-amber-300 bg-white/80 text-amber-900 hover:bg-white text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recarregando ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
