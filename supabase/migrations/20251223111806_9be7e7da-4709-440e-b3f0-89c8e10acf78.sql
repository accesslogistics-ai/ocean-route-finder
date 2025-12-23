-- Função para buscar armadores únicos
CREATE OR REPLACE FUNCTION get_unique_carriers()
RETURNS TABLE(carrier TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT carrier FROM tariffs ORDER BY carrier;
$$;

-- Função para buscar POLs únicos (opcionalmente filtrado por carrier)
CREATE OR REPLACE FUNCTION get_unique_pols(p_carrier TEXT DEFAULT NULL)
RETURNS TABLE(pol TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pol FROM tariffs 
  WHERE (p_carrier IS NULL OR carrier = p_carrier)
  ORDER BY pol;
$$;

-- Função para buscar PODs únicos (opcionalmente filtrado por carrier e pol)
CREATE OR REPLACE FUNCTION get_unique_pods(p_carrier TEXT DEFAULT NULL, p_pol TEXT DEFAULT NULL)
RETURNS TABLE(pod TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pod FROM tariffs 
  WHERE (p_carrier IS NULL OR carrier = p_carrier)
    AND (p_pol IS NULL OR pol = p_pol)
  ORDER BY pod;
$$;