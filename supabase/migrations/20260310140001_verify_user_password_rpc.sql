
-- Secure server-side password verification that does NOT create a new session.
-- Used by EmergencyKillSwitch and SecurityDashboard instead of signInWithPassword,
-- which has session side effects (refreshes tokens, resets session metadata).
--
-- Runs as SECURITY DEFINER to access auth.users.encrypted_password.
-- Returns TRUE if the provided password matches the calling user's stored hash.

CREATE OR REPLACE FUNCTION public.verify_current_password(_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _encrypted_password text;
BEGIN
  SELECT encrypted_password INTO _encrypted_password
  FROM auth.users
  WHERE id = auth.uid();

  IF _encrypted_password IS NULL THEN
    RETURN false;
  END IF;

  RETURN _encrypted_password = crypt(_password, _encrypted_password);
END;
$$;

-- Only authenticated users can call this (verifies their own password only)
REVOKE ALL ON FUNCTION public.verify_current_password(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_current_password(text) TO authenticated;
