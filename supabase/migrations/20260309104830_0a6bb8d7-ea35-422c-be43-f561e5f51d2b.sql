
-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL DEFAULT 'fisioterapeuta',
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitations_token_unique UNIQUE (token)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins/directors can manage invitations
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- Anyone can read by token (for setup page - no auth required)
CREATE POLICY "Public can read by token"
  ON public.invitations FOR SELECT
  TO anon
  USING (true);

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
