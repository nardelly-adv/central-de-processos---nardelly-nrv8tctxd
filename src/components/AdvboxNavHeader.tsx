import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Users, DollarSign, CheckSquare, FileText } from 'lucide-react'

const TABS = [
  { to: '/advbox', label: 'Painel Geral', icon: LayoutDashboard, exact: true },
  { to: '/advbox/processos', label: 'Processos', icon: Briefcase },
  { to: '/advbox/clientes', label: 'Clientes', icon: Users },
  { to: '/advbox/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/advbox/tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: '/advbox/documentos', label: 'Documentos', icon: FileText },
]

export function AdvboxNavHeader({ titulo, descricao }: { titulo: string; descricao?: string }) {
  const location = useLocation()

  return (
    <div className="border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800">
                AdvBox API
              </span>
              <span className="text-xs text-slate-500">Gestão Jurídica Integrada</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
            {descricao && <p className="text-sm text-slate-600 mt-0.5">{descricao}</p>}
          </div>
        </div>

        {/* Abas de navegação do AdvBox */}
        <nav className="flex space-x-1 sm:space-x-2 mt-5 overflow-x-auto pb-1 -mb-4 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isAtivo = tab.exact
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to)
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  isAtivo
                    ? 'border-teal-600 text-teal-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isAtivo ? 'text-teal-700' : 'text-slate-400'}`} />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
