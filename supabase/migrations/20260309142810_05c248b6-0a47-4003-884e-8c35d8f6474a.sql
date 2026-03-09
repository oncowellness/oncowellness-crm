
-- ============================================================
-- FINANCIAL MODULE — Sprint S14
-- Boundary: Administrative & Financial System (Holded-style)
-- Access: admin / director ONLY
-- ============================================================

-- Enums
CREATE TYPE public.plan_billing_cycle AS ENUM ('monthly', 'annual', 'one_time');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('transfer', 'card', 'cash', 'other');
CREATE TYPE public.expense_category AS ENUM ('payroll', 'equipment', 'rent', 'software', 'marketing', 'other');

-- 1. PLANS
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(10,2),
  max_sessions INTEGER,
  billing_cycle plan_billing_cycle NOT NULL DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage plans" ON public.plans
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- 2. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status subscription_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- 3. INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- 4. INVOICE ITEMS
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoice items" ON public.invoice_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- 5. PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method payment_method NOT NULL DEFAULT 'transfer',
  reference TEXT,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- 6. EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  approved_by UUID,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- Updated_at triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Unique constraint on invoice number
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);
