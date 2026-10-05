import PocketBase, { BaseAuthStore, type AuthRecord } from 'pocketbase'

const SESSION_KEY = 'central_processos_pb_auth_v1'

/**
 * O LocalAuthStore padrão usa localStorage e sincroniza tokens entre abas.
 * Aqui o token é isolado por aba no sessionStorage: trocar de usuário em outra aba
 * não muda a identidade desta, e recarregar preserva somente a sessão desta aba.
 */
class TabSessionAuthStore extends BaseAuthStore {
  constructor() {
    super()
    if (typeof window === 'undefined') return

    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { token?: string; record?: AuthRecord }
      super.save(saved.token || '', saved.record || null)
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY)
      super.clear()
    }
  }

  save(token: string, record?: AuthRecord): void {
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          window.sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ token, record: record || null }),
          )
        } else {
          window.sessionStorage.removeItem(SESSION_KEY)
        }
      } catch {
        // Keep the live tab session in memory if browser storage is unavailable.
      }
    }
    super.save(token, record)
  }

  clear(): void {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(SESSION_KEY)
      } catch {
        // Clearing the in-memory store below still removes this tab's credentials.
      }
    }
    super.clear()
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new TabSessionAuthStore())
pb.autoCancellation(false)

export default pb
