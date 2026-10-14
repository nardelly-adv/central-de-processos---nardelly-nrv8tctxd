export function formatarCPFouCNPJ(valor?: string): string {
  if (!valor) return '—'
  const limpo = valor.replace(/\D/g, '')
  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (limpo.length === 14) {
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return valor
}

export function formatarTelefone(valor?: string): string {
  if (!valor) return '—'
  const limpo = valor.replace(/\D/g, '')
  if (limpo.length === 11) {
    return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (limpo.length === 10) {
    return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return valor
}

export function formatarMoeda(valor?: number | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(dataIso?: string | null): string {
  if (!dataIso) return '—'
  try {
    const dataLimpa = dataIso.split('T')[0].split(' ')[0]
    const partes = dataLimpa.split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    const d = new Date(dataIso)
    if (isNaN(d.getTime())) return dataIso
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dataIso
  }
}

export function formatarBytes(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatarCNJ(numero?: string): string {
  if (!numero) return '—'
  const limpo = numero.replace(/\D/g, '')
  if (limpo.length === 20) {
    return limpo.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6')
  }
  return numero
}
