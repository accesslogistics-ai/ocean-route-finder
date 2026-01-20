-- Recreate the function with company column
CREATE OR REPLACE FUNCTION public.check_whitelist_email(p_email text)
RETURNS TABLE(id uuid, email text, country text, role app_role, expires_at timestamp with time zone, is_valid boolean, company text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    w.id,
    w.email,
    w.country,
    w.role,
    w.expires_at,
    (w.expires_at > now()) as is_valid,
    w.company
  FROM public.email_whitelist w
  WHERE LOWER(w.email) = LOWER(p_email)
  LIMIT 1;
$function$;