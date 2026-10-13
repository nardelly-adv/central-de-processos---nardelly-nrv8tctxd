/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import AdminUsuarios from './pages/AdminUsuarios'
import Auditoria from './pages/Auditoria'
import AcessoNegado from './pages/AcessoNegado'
import NovaFicha from './pages/NovaFicha'
import CasoDetalhe from './pages/CasoDetalhe'
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
                <Index />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
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
