/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import Processos from './pages/Processos'
import ProcessoDetalhe from './pages/ProcessoDetalhe'
import Documentos from './pages/Documentos'
import Agenda from './pages/Agenda'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import AdminUsuarios from './pages/AdminUsuarios'
import Auditoria from './pages/Auditoria'
import AcessoNegado from './pages/AcessoNegado'
import AdminAdvbox from './pages/AdminAdvbox'
import NovaFicha from './pages/NovaFicha'
import CasoDetalhe from './pages/CasoDetalhe'
import AdvboxDashboard from './pages/AdvboxDashboard'
import AdvboxProcessos from './pages/AdvboxProcessos'
import AdvboxClientes from './pages/AdvboxClientes'
import AdvboxFinanceiro from './pages/AdvboxFinanceiro'
import AdvboxTarefas from './pages/AdvboxTarefas'
import AdvboxDocumentos from './pages/AdvboxDocumentos'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <ProtectedRoute>
                <ClienteDetalhe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processos"
            element={
              <ProtectedRoute>
                <Processos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processos/:id"
            element={
              <ProtectedRoute>
                <ProcessoDetalhe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentos"
            element={
              <ProtectedRoute>
                <Documentos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <Agenda />
              </ProtectedRoute>
            }
          />

          {/* Rotas AdvBox - Acessíveis para todos os usuários autenticados da equipe compartilhada */}
          <Route
            path="/advbox"
            element={
              <ProtectedRoute>
                <AdvboxDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advbox/processos"
            element={
              <ProtectedRoute>
                <AdvboxProcessos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advbox/clientes"
            element={
              <ProtectedRoute>
                <AdvboxClientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advbox/financeiro"
            element={
              <ProtectedRoute>
                <AdvboxFinanceiro />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advbox/tarefas"
            element={
              <ProtectedRoute>
                <AdvboxTarefas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advbox/documentos"
            element={
              <ProtectedRoute>
                <AdvboxDocumentos />
              </ProtectedRoute>
            }
          />
          <Route path="/entrar" element={<Login />} />
          <Route path="/acesso-negado" element={<AcessoNegado />} />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute allowedRoles={['administracao']}>
                <AdminUsuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/advbox"
            element={
              <ProtectedRoute allowedRoles={['administracao']}>
                <AdminAdvbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake/nova"
            element={
              <ProtectedRoute allowedRoles={['atendimento', 'cadastro']}>
                <NovaFicha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caso/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'atendimento',
                  'cadastro',
                  'operacao_documental',
                  'triagem_juridica',
                  'advogado_responsavel',
                  'supervisao',
                ]}
              >
                <CasoDetalhe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute
                allowedRoles={['supervisao', 'administracao', 'advogado_responsavel']}
              >
                <Auditoria />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
