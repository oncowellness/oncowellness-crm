import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, FileText, CreditCard, TrendingDown, Plus } from 'lucide-react'
import {
  usePlans, useCreatePlan,
  useInvoices, useCreateInvoice, useUpdateInvoiceStatus,
  usePayments, useCreatePayment,
  useExpenses, useCreateExpense,
  useSubscriptions, useCreateSubscription,
} from '@/hooks/useFinancial'
import { usePatients } from '@/hooks/usePatients'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500',
  sent: 'bg-blue-500',
  paid: 'bg-emerald-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
}

export function FinancialDashboard() {
  const { data: invoices = [] } = useInvoices()
  const { data: payments = [] } = usePayments()
  const { data: expenses = [] } = useExpenses()

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0)
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administración Financiera</h1>
        <p className="text-sm text-muted-foreground">Gestión de planes, facturación, cobros y gastos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={<FileText size={20} />} label="Total Facturado" value={`€${totalInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} color="text-blue-500" />
        <KpiCard icon={<CreditCard size={20} />} label="Total Cobrado" value={`€${totalCollected.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} color="text-emerald-500" />
        <KpiCard icon={<DollarSign size={20} />} label="Pendiente de Cobro" value={`€${(totalInvoiced - totalPaid).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} color="text-amber-500" />
        <KpiCard icon={<TrendingDown size={20} />} label="Total Gastos" value={`€${totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} color="text-red-500" />
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payments">Cobros</TabsTrigger>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        <TabsContent value="plans"><PlansTab /></TabsContent>
        <TabsContent value="subscriptions"><SubscriptionsTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={color}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Plans Tab ──────────────────────────────────────────────────────────────
function PlansTab() {
  const { data: plans = [], isLoading } = usePlans()
  const createPlan = useCreatePlan()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price_monthly: '', price_annual: '', max_sessions: '', billing_cycle: 'monthly' as const })

  const handleCreate = async () => {
    if (!form.name || !form.price_monthly) return
    try {
      await createPlan.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        price_monthly: parseFloat(form.price_monthly),
        price_annual: form.price_annual ? parseFloat(form.price_annual) : undefined,
        max_sessions: form.max_sessions ? parseInt(form.max_sessions) : undefined,
        billing_cycle: form.billing_cycle,
      })
      toast({ title: 'Plan creado' })
      setOpen(false)
      setForm({ name: '', description: '', price_monthly: '', price_annual: '', max_sessions: '', billing_cycle: 'monthly' })
    } catch { toast({ title: 'Error al crear plan', variant: 'destructive' }) }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Planes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Nuevo Plan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Plan</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Precio Mensual (€)</Label><Input type="number" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: e.target.value }))} /></div>
                <div><Label>Precio Anual (€)</Label><Input type="number" value={form.price_annual} onChange={e => setForm(f => ({ ...f, price_annual: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Máx. Sesiones</Label><Input type="number" value={form.max_sessions} onChange={e => setForm(f => ({ ...f, max_sessions: e.target.value }))} /></div>
                <div>
                  <Label>Ciclo de Facturación</Label>
                  <Select value={form.billing_cycle} onValueChange={(v: any) => setForm(f => ({ ...f, billing_cycle: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="one_time">Pago Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createPlan.isPending} className="w-full">{createPlan.isPending ? 'Creando...' : 'Crear Plan'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : plans.length === 0 ? <p className="text-sm text-muted-foreground">No hay planes configurados.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Mensual</TableHead><TableHead>Anual</TableHead><TableHead>Sesiones</TableHead><TableHead>Ciclo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              {plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>€{Number(p.price_monthly).toFixed(2)}</TableCell>
                  <TableCell>{p.price_annual ? `€${Number(p.price_annual).toFixed(2)}` : '—'}</TableCell>
                  <TableCell>{p.max_sessions ?? '∞'}</TableCell>
                  <TableCell className="capitalize">{p.billing_cycle === 'one_time' ? 'Único' : p.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}</TableCell>
                  <TableCell><Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Invoices Tab ───────────────────────────────────────────────────────────
function InvoicesTab() {
  const { data: invoices = [], isLoading } = useInvoices()
  const { data: patients = [] } = usePatients()
  const createInvoice = useCreateInvoice()
  const updateStatus = useUpdateInvoiceStatus()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ patient_id: '', subtotal: '', tax_rate: '21', notes: '' })

  const handleCreate = async () => {
    if (!form.patient_id || !form.subtotal) return
    const subtotal = parseFloat(form.subtotal)
    const taxRate = parseFloat(form.tax_rate)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount
    const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    try {
      await createInvoice.mutateAsync({
        patient_id: form.patient_id,
        invoice_number: invoiceNumber,
        subtotal,
        tax_rate: taxRate,
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        due_date: dueDate.toISOString().split('T')[0],
        notes: form.notes || undefined,
      })
      toast({ title: 'Factura creada' })
      setOpen(false)
      setForm({ patient_id: '', subtotal: '', tax_rate: '21', notes: '' })
    } catch { toast({ title: 'Error al crear factura', variant: 'destructive' }) }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Facturas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Nueva Factura</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Factura</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtotal (€)</Label><Input type="number" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} /></div>
                <div><Label>IVA (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} /></div>
              </div>
              {form.subtotal && (
                <p className="text-sm text-muted-foreground">
                  Total: €{(parseFloat(form.subtotal || '0') * (1 + parseFloat(form.tax_rate || '0') / 100)).toFixed(2)}
                </p>
              )}
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={createInvoice.isPending} className="w-full">{createInvoice.isPending ? 'Creando...' : 'Crear Factura'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : invoices.length === 0 ? <p className="text-sm text-muted-foreground">No hay facturas.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nº Factura</TableHead><TableHead>Paciente</TableHead><TableHead>Fecha</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.patients?.nombre ?? '—'}</TableCell>
                  <TableCell>{new Date(inv.issue_date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="font-medium">€{Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell><Badge className={INVOICE_STATUS_COLORS[inv.status] ?? ''}>{INVOICE_STATUS_LABELS[inv.status] ?? inv.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={inv.status} onValueChange={(v: any) => updateStatus.mutate({ id: inv.id, status: v })}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="sent">Enviada</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                        <SelectItem value="overdue">Vencida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Payments Tab ───────────────────────────────────────────────────────────
function PaymentsTab() {
  const { data: payments = [], isLoading } = usePayments()
  const { data: invoices = [] } = useInvoices()
  const createPayment = useCreatePayment()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ invoice_id: '', amount: '', method: 'transfer' as const, reference: '', notes: '' })

  const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')

  const handleCreate = async () => {
    if (!form.invoice_id || !form.amount) return
    try {
      await createPayment.mutateAsync({
        invoice_id: form.invoice_id,
        amount: parseFloat(form.amount),
        payment_date: new Date().toISOString().split('T')[0],
        method: form.method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      })
      toast({ title: 'Pago registrado' })
      setOpen(false)
      setForm({ invoice_id: '', amount: '', method: 'transfer', reference: '', notes: '' })
    } catch { toast({ title: 'Error al registrar pago', variant: 'destructive' }) }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Cobros</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Registrar Cobro</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Cobro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Factura</Label>
                <Select value={form.invoice_id} onValueChange={v => {
                  const inv = unpaidInvoices.find(i => i.id === v)
                  setForm(f => ({ ...f, invoice_id: v, amount: inv ? String(inv.total) : '' }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar factura" /></SelectTrigger>
                  <SelectContent>{unpaidInvoices.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — €{Number(i.total).toFixed(2)} ({i.patients?.nombre})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto (€)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div>
                  <Label>Método</Label>
                  <Select value={form.method} onValueChange={(v: any) => setForm(f => ({ ...f, method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Referencia</Label><Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Nº transferencia, recibo, etc." /></div>
              <Button onClick={handleCreate} disabled={createPayment.isPending} className="w-full">{createPayment.isPending ? 'Registrando...' : 'Registrar Cobro'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : payments.length === 0 ? <p className="text-sm text-muted-foreground">No hay cobros registrados.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Factura</TableHead><TableHead>Paciente</TableHead><TableHead>Monto</TableHead><TableHead>Fecha</TableHead><TableHead>Método</TableHead><TableHead>Referencia</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.invoices?.invoice_number ?? '—'}</TableCell>
                  <TableCell>{p.invoices?.patients?.nombre ?? '—'}</TableCell>
                  <TableCell className="font-medium">€{Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="capitalize">{p.method === 'transfer' ? 'Transferencia' : p.method === 'card' ? 'Tarjeta' : p.method === 'cash' ? 'Efectivo' : 'Otro'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.reference || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Subscriptions Tab ──────────────────────────────────────────────────────
function SubscriptionsTab() {
  const { data: subs = [], isLoading } = useSubscriptions()
  const { data: patients = [] } = usePatients()
  const { data: plans = [] } = usePlans()
  const createSub = useCreateSubscription()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ patient_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] })

  const handleCreate = async () => {
    if (!form.patient_id || !form.plan_id) return
    try {
      await createSub.mutateAsync(form)
      toast({ title: 'Suscripción creada' })
      setOpen(false)
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }

  const STATUS_LABELS: Record<string, string> = { active: 'Activa', paused: 'Pausada', cancelled: 'Cancelada', expired: 'Expirada' }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Suscripciones</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Nueva Suscripción</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Suscripción</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan_id} onValueChange={v => setForm(f => ({ ...f, plan_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{(plans ?? []).filter(p => p.active).map(p => <SelectItem key={p.id} value={p.id}>{p.name} — €{Number(p.price_monthly).toFixed(2)}/mes</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fecha Inicio</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={createSub.isPending} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : subs.length === 0 ? <p className="text-sm text-muted-foreground">No hay suscripciones.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Plan</TableHead><TableHead>Inicio</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              {subs.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.patients?.nombre ?? '—'}</TableCell>
                  <TableCell>{s.plans?.name ?? '—'}</TableCell>
                  <TableCell>{new Date(s.start_date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{STATUS_LABELS[s.status] ?? s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Expenses Tab ───────────────────────────────────────────────────────────
function ExpensesTab() {
  const { data: expenses = [], isLoading } = useExpenses()
  const createExpense = useCreateExpense()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'other' as const, vendor: '', expense_date: new Date().toISOString().split('T')[0] })

  const CATEGORY_LABELS: Record<string, string> = { payroll: 'Nómina', equipment: 'Equipo', rent: 'Alquiler', software: 'Software', marketing: 'Marketing', other: 'Otro' }

  const handleCreate = async () => {
    if (!form.description || !form.amount) return
    try {
      await createExpense.mutateAsync({
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        vendor: form.vendor || undefined,
        expense_date: form.expense_date,
      })
      toast({ title: 'Gasto registrado' })
      setOpen(false)
      setForm({ description: '', amount: '', category: 'other', vendor: '', expense_date: new Date().toISOString().split('T')[0] })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Gastos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus size={14} className="mr-1" />Nuevo Gasto</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Descripción</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto (€)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={(v: any) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Proveedor</Label><Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} /></div>
                <div><Label>Fecha</Label><Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={createExpense.isPending} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : expenses.length === 0 ? <p className="text-sm text-muted-foreground">No hay gastos.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead>Monto</TableHead><TableHead>Proveedor</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {expenses.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{e.description}</TableCell>
                  <TableCell className="capitalize">{CATEGORY_LABELS[e.category] ?? e.category}</TableCell>
                  <TableCell className="font-medium">€{Number(e.amount).toFixed(2)}</TableCell>
                  <TableCell>{e.vendor || '—'}</TableCell>
                  <TableCell>{new Date(e.expense_date).toLocaleDateString('es-ES')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
