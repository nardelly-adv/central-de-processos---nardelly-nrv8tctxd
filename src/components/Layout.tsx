import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  Scale,
  ShieldCheck,
  PlugZap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/processos', label: 'Processos', icon: Briefcase },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/agenda', label: 'Agenda & Prazos', icon: Calendar },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Ignorar layout da barra nas rotas de login
  if (location.pathname === '/entrar') {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    )
  }

  const usuario = pb.authStore.record as Record<string, any> | null
  const papel = String(usuario?.papel || '')

  const sair = () => {
    pb.authStore.clear()
    navigate('/entrar')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-teal-900 text-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-teal-700/80 p-1.5 rounded-lg">
            <Scale className="h-5 w-5 text-teal-200" />
          </div>
          <span className="font-semibold tracking-tight text-white">Central de Processos</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-teal-800 transition"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-teal-950 text-white px-4 py-4 space-y-1 shadow-lg z-30 border-b border-teal-800">
          <div className="px-3 py-2 mb-2 bg-teal-900/60 rounded-lg">
            <p className="text-xs text-teal-200 uppercase font-semibold">Equipe Conectada</p>
            <p className="text-sm font-medium truncate">
              {usuario?.name || usuario?.email || 'Membro da Equipe'}
            </p>
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const ativo =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  ativo
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-teal-100 hover:bg-teal-900/70 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          {papel === 'administracao' && (
            <>
              <Link
                to="/admin/usuarios"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-teal-900/70"
              >
                <ShieldCheck className="h-4 w-4" />
                Usuários & Papéis
              </Link>
              <Link
                to="/admin/advbox"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-teal-900/70"
              >
                <PlugZap className="h-4 w-4" />
                Integração ADVBOX
              </Link>
            </>
          )}
          <div className="pt-2 border-t border-teal-800/80">
            <button
              onClick={sair}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/40 w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Sair da Central
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 shrink-0 border-r border-slate-800 select-none">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center text-white shadow-md">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight tracking-tight text-white">
              Central de Processos
            </h1>
            <p className="text-xs text-teal-400 font-medium">Gestão Jurídica Integrada</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const ativo =
              item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  ativo
                    ? 'bg-teal-700 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${ativo ? 'text-teal-200' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}

          {/* Links Administrativos se aplicável */}
          {papel === 'administracao' && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sistema
              </div>
              <Link
                to="/admin/usuarios"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/admin/usuarios'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Usuários do Escritório
              </Link>
              <Link
                to="/admin/advbox"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === '/admin/advbox'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <PlugZap className="h-4 w-4 text-slate-400" />
                Integração ADVBOX
              </Link>
            </div>
          )}
        </div>

        {/* Equipe / User Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-teal-800 text-teal-100 flex items-center justify-center font-semibold text-xs shrink-0">
                {(usuario?.name || usuario?.email || 'AD')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">
                  {usuario?.name || 'Equipe do Escritório'}
                </p>
                <p className="text-[11px] text-teal-300/80 truncate">
                  {usuario?.email || 'equipe@central.adv.br'}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={sair}
            className="w-full text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 justify-start h-8 px-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Desconectar sessão
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
