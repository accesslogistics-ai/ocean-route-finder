
-- Create RPC function to get tariffs filtered by country (for admin simulation)
CREATE OR REPLACE FUNCTION public.get_tariffs_by_country(p_country text)
RETURNS SETOF tariffs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.*
  FROM tariffs t
  WHERE EXISTS (
    SELECT 1 
    FROM port_countries pc
    WHERE pc.port = t.pod
      AND pc.country = p_country
  )
  ORDER BY t.carrier;
$$;
