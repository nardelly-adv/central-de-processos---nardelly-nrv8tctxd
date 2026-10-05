import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 50

const Auditoria = () => {
  const [registros, setRegistros] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)

  const carregar = useCallback(async (page: number, anexar: boolean) => {
    setErro('')
    setCarregando(true)
    try {
      const resultado = await pb
        .collection('auditoria')
        .getList(page, PAGE_SIZE, { sort: '-created' })
      setRegistros((atuais) => (anexar ? [...atuais, ...resultado.items] : resultado.items))
      setPagina(page)
      setTemMais(page < resultado.totalPages)
    } catch (e: any) {
      setErro(e?.response?.message || 'Não foi possível carregar a trilha.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregar(1, false)
  }, [carregar])

  const formatarData = (valor: string) => {
    if (!valor) return '—'
    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Trilha de auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Ações críticas, negações, data/hora e mudanças de estado registradas pelo servidor.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
        {erro && (
          <p role="alert" className="text-sm text-red-700">
            {erro}
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos carregados: {registros.length}</CardTitle>
          </CardHeader>
          <CardContent>
            {carregando && registros.length === 0 ? (
              <p role="status">Carregando trilha…</p>
            ) : registros.length === 0 ? (
              <p>Nenhum evento encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data e hora</TableHead>
                      <TableHead>Ator</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Estado anterior</TableHead>
                      <TableHead>Estado novo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatarData(r.created)}
                        </TableCell>
                        <TableCell>{r.ator || '—'}</TableCell>
                        <TableCell>{r.acao || '—'}</TableCell>
                        <TableCell>{r.entidade || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.entidade_id || '—'}</TableCell>
                        <TableCell>
                          <pre className="max-w-xs whitespace-pre-wrap break-all text-xs">
                            {r.estado_anterior || '—'}
                          </pre>
                        </TableCell>
                        <TableCell>
                          <pre className="max-w-xs whitespace-pre-wrap break-all text-xs">
                            {r.estado_novo || '—'}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              {temMais && (
                <Button
                  variant="outline"
                  disabled={carregando}
                  onClick={() => void carregar(pagina + 1, true)}
                >
                  {carregando ? 'Carregando…' : 'Carregar eventos anteriores'}
                </Button>
              )}
              {carregando && registros.length > 0 && (
                <span role="status" className="text-sm">
                  Atualizando…
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Auditoria
