import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIncentivesSummary, useApproveIncentive } from '@/hooks/useIncentives'
import { useProfiles } from '@/hooks/useProfiles'
import { DollarSign, TrendingUp, Award, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CONCEPT_LABELS: Record<string, string> = {
  fijo: 'Fijo por sesión',
  hito_clinico: 'Hito clínico',
  video_rrss: 'Vídeo RRSS',
  bono_extra: 'Bono extra',
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  pagado: 'bg-blue-100 text-blue-800',
}

function getMonthOptions() {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    })
  }
  return months
}

export default function IncentivesPanel() {
  const monthOptions = getMonthOptions()
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)
  const { data: summary, isLoading } = useIncentivesSummary(selectedMonth)
  const { data: profiles } = useProfiles()
  const approve = useApproveIncentive()

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

  const grandTotal = summary
    ? Object.values(summary).reduce((acc, s) => acc + s.total, 0)
    : 0

  const totalFijo = summary
    ? Object.values(summary).reduce((acc, s) => acc + s.fijo, 0)
    : 0

  const totalVariable = grandTotal - totalFijo

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Liquidación Mensual</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grandTotal.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fijo (Sesiones)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFijo.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variable (Hitos + Bonos)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVariable.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Breakdown */}
      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : summary && Object.keys(summary).length > 0 ? (
        Object.entries(summary).map(([staffId, data]) => {
          const profile = profileMap.get(staffId)
          return (
            <Card key={staffId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  {profile?.nombre ?? 'Staff desconocido'}
                  <Badge variant="outline" className="ml-2">{profile?.especialidad ?? '—'}</Badge>
                  <span className="ml-auto text-lg font-bold text-primary">{data.total.toFixed(2)} €</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>{CONCEPT_LABELS[item.concepto] ?? item.concepto}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.descripcion ?? '—'}</TableCell>
                        <TableCell className="font-medium">{Number(item.monto).toFixed(2)} €</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[item.estado ?? 'pendiente']}>
                            {item.estado ?? 'pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approve.mutate(item.id)}
                              disabled={approve.isPending}
                            >
                              Aprobar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay incentivos registrados para este mes.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
