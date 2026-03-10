
-- Replace accept_invitation to also assign the role server-side.
-- This removes the client-side user_roles INSERT in SetupAccount.tsx which
-- allowed users to self-escalate privileges by intercepting the invitation.role value.
--
-- The function is SECURITY DEFINER so it runs as the migration owner and can
-- write to user_roles regardless of the calling user's RLS context.

CREATE OR REPLACE FUNCTION public.accept_invitation(_invitation_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Fetch and mark accepted in one step to prevent TOCTOU race
  UPDATE public.invitations
  SET accepted_at = now()
  WHERE id = _invitation_id AND accepted_at IS NULL
  RETURNING role INTO _role;

  -- If no row updated, invitation was already used or doesn't exist
  IF _role IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already accepted';
  END IF;

  -- Assign role server-side — role comes from the DB record, not the client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action_type, resource_type, resource_id, metadata)
  VALUES (_user_id, 'invitation_accepted', 'invitation', _invitation_id,
          jsonb_build_object('role', _role));
END;
$$;
