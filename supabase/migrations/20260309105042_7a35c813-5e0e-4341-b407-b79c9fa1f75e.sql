
-- Allow admins to delete invitations
CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- Allow admins to insert invitations  
CREATE POLICY "Admins can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));
