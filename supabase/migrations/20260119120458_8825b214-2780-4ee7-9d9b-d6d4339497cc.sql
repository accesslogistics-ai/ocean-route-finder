-- Create destinations table to store port-to-country mappings
CREATE TABLE public.destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(destination, country)
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view destinations
CREATE POLICY "Authenticated users can view destinations"
  ON public.destinations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage destinations
CREATE POLICY "Admins can manage destinations"
  ON public.destinations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get tariffs filtered by user's country
CREATE OR REPLACE FUNCTION public.get_tariffs_by_country(p_country text)
RETURNS SETOF tariffs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT t.*
  FROM tariffs t
  INNER JOIN destinations d ON LOWER(d.destination) = LOWER(t.pod)
  WHERE LOWER(d.country) = LOWER(p_country)
  ORDER BY t.carrier;
$$;

-- Function to get PODs filtered by user's country
CREATE OR REPLACE FUNCTION public.get_pods_by_country(
  p_country text,
  p_carrier text DEFAULT NULL,
  p_pol text DEFAULT NULL
)
RETURNS TABLE(pod text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT t.pod
  FROM tariffs t
  INNER JOIN destinations d ON LOWER(d.destination) = LOWER(t.pod)
  WHERE LOWER(d.country) = LOWER(p_country)
    AND (p_carrier IS NULL OR t.carrier = p_carrier)
    AND (p_pol IS NULL OR t.pol = p_pol)
  ORDER BY t.pod;
$$;

-- Function to get unique countries from destinations
CREATE OR REPLACE FUNCTION public.get_unique_countries()
RETURNS TABLE(country text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT country FROM destinations ORDER BY country;
$$;