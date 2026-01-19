-- Change SECURITY DEFINER functions to SECURITY INVOKER to respect RLS policies
-- This ensures these functions don't bypass RLS if policies are tightened in the future

-- Update get_unique_carriers to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_unique_carriers()
RETURNS TABLE(carrier TEXT)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT carrier FROM tariffs ORDER BY carrier;
$$;

-- Update get_unique_pols to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_unique_pols(p_carrier TEXT DEFAULT NULL)
RETURNS TABLE(pol TEXT)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT pol 
  FROM tariffs 
  WHERE (p_carrier IS NULL OR carrier = p_carrier)
  ORDER BY pol;
$$;

-- Update get_unique_pods to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_unique_pods(p_carrier TEXT DEFAULT NULL, p_pol TEXT DEFAULT NULL)
RETURNS TABLE(pod TEXT)
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT pod 
  FROM tariffs 
  WHERE (p_carrier IS NULL OR carrier = p_carrier)
    AND (p_pol IS NULL OR pol = p_pol)
  ORDER BY pod;
$$;