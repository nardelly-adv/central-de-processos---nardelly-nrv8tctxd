import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const AcessoNegado = () => (
  <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
    <div className="max-w-lg space-y-4 rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Acesso não autorizado</h1>
      <p role="alert">
        O perfil autenticado não tem permissão para abrir esta área. A proteção também é aplicada no
        servidor.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao painel do seu perfil</Link>
      </Button>
    </div>
  </div>
)

export default AcessoNegado
