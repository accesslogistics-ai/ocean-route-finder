-- Drop existing restrictive RLS policy on tariffs
DROP POLICY IF EXISTS "Users can view tariffs based on country" ON public.tariffs;

-- Create new simple policy allowing all authenticated users to view all tariffs
CREATE POLICY "Authenticated users can view all tariffs" ON public.tariffs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Drop country-related functions
DROP FUNCTION IF EXISTS public.get_tariffs_by_country(text);
DROP FUNCTION IF EXISTS public.can_view_tariff(uuid, text);
DROP FUNCTION IF EXISTS public.get_unique_countries();

-- Drop port_countries table and its policies
DROP POLICY IF EXISTS "Admins can delete port_countries" ON public.port_countries;
DROP POLICY IF EXISTS "Admins can insert port_countries" ON public.port_countries;
DROP POLICY IF EXISTS "Admins can update port_countries" ON public.port_countries;
DROP POLICY IF EXISTS "Anyone can read port_countries" ON public.port_countries;
DROP TABLE IF EXISTS public.port_countries;