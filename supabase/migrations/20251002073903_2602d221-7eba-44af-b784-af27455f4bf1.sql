-- Add INSERT policy for admin_users table
-- This allows users to add themselves as admin during signup
-- In production, you may want to restrict this further or handle admin creation differently
CREATE POLICY "Users can insert themselves as admin"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());