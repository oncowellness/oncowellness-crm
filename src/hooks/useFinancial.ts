import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// ─── Plans ──────────────────────────────────────────────────────────────────
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('plans').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plan: { name: string; description?: string; price_monthly: number; price_annual?: number; max_sessions?: number; billing_cycle: 'monthly' | 'annual' | 'one_time' }) => {
      const { error } = await supabase.from('plans').insert([plan])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

// ─── Subscriptions ──────────────────────────────────────────────────────────
export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, patients(nombre, codigo), plans(name, price_monthly)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sub: { patient_id: string; plan_id: string; start_date: string; end_date?: string }) => {
      const { error } = await supabase.from('subscriptions').insert([sub])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}

// ─── Invoices ───────────────────────────────────────────────────────────────
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(nombre, codigo)')
        .order('issue_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoice: {
      patient_id: string
      invoice_number: string
      subtotal: number
      tax_rate: number
      tax_amount: number
      total: number
      due_date: string
      subscription_id?: string
      notes?: string
    }) => {
      const { error } = await supabase.from('invoices').insert([invoice])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' }) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

// ─── Payments ───────────────────────────────────────────────────────────────
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoices(invoice_number, total, patients(nombre))')
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payment: { invoice_id: string; amount: number; payment_date: string; method: 'transfer' | 'card' | 'cash' | 'other'; reference?: string; notes?: string }) => {
      const { error } = await supabase.from('payments').insert([payment])
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// ─── Expenses ───────────────────────────────────────────────────────────────
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (expense: { category: 'payroll' | 'equipment' | 'rent' | 'software' | 'marketing' | 'other'; description: string; amount: number; expense_date: string; vendor?: string }) => {
      const { error } = await supabase.from('expenses').insert([expense])
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}
