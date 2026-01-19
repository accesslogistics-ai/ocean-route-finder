-- Drop existing permissive write policies on tariffs table
DROP POLICY IF EXISTS "Anyone can insert tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Anyone can update tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Anyone can delete tariffs" ON public.tariffs;

-- Create admin-only write policies using the existing has_role function
CREATE POLICY "Admins can insert tariffs"
ON public.tariffs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tariffs"
ON public.tariffs FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tariffs"
ON public.tariffs FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));