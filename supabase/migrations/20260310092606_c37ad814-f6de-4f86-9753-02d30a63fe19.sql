
-- Create a secure RPC to accept an invitation (mark as accepted)
-- This runs as SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION public.accept_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invitations
  SET accepted_at = now()
  WHERE id = _invitation_id AND accepted_at IS NULL;
$$;
