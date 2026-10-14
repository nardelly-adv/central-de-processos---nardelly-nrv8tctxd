import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'anonymous' | 'forbidden'>(
    'checking',
  )
  const [verifiedRole, setVerifiedRole] = useState('')
  const activeRef = useRef(true)
  const checkingRef = useRef(false)
  const lastAllowedKeyRef = useRef<string | null>(null)
  const allowedKey = allowedRoles?.join('|') || ''

  const validateSession = useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true

    // Keep the protected screen mounted during focus revalidation so an open form
    // retains its in-memory values. Initial loads and permission changes still gate.
    if (lastAllowedKeyRef.current !== allowedKey) setStatus('checking')

    if (!pb.authStore.isValid || !pb.authStore.record) {
      pb.authStore.clear()
      if (activeRef.current) setStatus('anonymous')
      checkingRef.current = false
      return
    }

    try {
      // Revalidate on initial route load and whenever the tab returns to focus.
      const result = await pb.collection('users').authRefresh()
      const user = result.record as Record<string, unknown> | undefined
      if (!user || user.ativo !== true) throw new Error('Sessão inativa ou revogada.')

      const role = String(user.papel || '')
      if (!activeRef.current) return
      setVerifiedRole(role)
      lastAllowedKeyRef.current = allowedKey
      setStatus(allowedKey && !allowedKey.split('|').includes(role) ? 'forbidden' : 'authenticated')
    } catch {
      pb.authStore.clear()
      if (activeRef.current) setStatus('anonymous')
    } finally {
      checkingRef.current = false
    }
  }, [allowedKey])

  useEffect(() => {
    activeRef.current = true
    void validateSession()

    const revalidateWhenActive = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        void validateSession()
      }
    }
    window.addEventListener('focus', revalidateWhenActive)
    document.addEventListener('visibilitychange', revalidateWhenActive)
    window.addEventListener('pageshow', revalidateWhenActive)

    return () => {
      activeRef.current = false
      window.removeEventListener('focus', revalidateWhenActive)
      document.removeEventListener('visibilitychange', revalidateWhenActive)
      window.removeEventListener('pageshow', revalidateWhenActive)
    }
  }, [validateSession])

  if (status === 'checking') {
    return (
      <main className="min-h-screen grid place-items-center p-6" role="status">
        Validando sessão no servidor…
      </main>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  if (status === 'forbidden') {
    return <Navigate to="/acesso-negado" replace state={{ role: verifiedRole }} />
  }
  return <>{children}</>
}

export default ProtectedRoute
