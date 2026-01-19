-- Add language column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt';

-- Update the get_user_activity_summary function to support p_month = 0 (all months)
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(p_year integer, p_month integer)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  country text,
  access_count bigint,
  search_count bigint,
  last_access timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.country,
    COALESCE(a.access_count, 0) as access_count,
    COALESCE(s.search_count, 0) as search_count,
    a.last_access
  FROM profiles p
  LEFT JOIN (
    SELECT 
      al.user_id,
      COUNT(*) as access_count,
      MAX(al.accessed_at) as last_access
    FROM access_logs al
    WHERE EXTRACT(YEAR FROM al.accessed_at) = p_year
      AND (p_month = 0 OR EXTRACT(MONTH FROM al.accessed_at) = p_month)
    GROUP BY al.user_id
  ) a ON p.user_id = a.user_id
  LEFT JOIN (
    SELECT 
      sl.user_id,
      COUNT(*) as search_count
    FROM search_logs sl
    WHERE EXTRACT(YEAR FROM sl.searched_at) = p_year
      AND (p_month = 0 OR EXTRACT(MONTH FROM sl.searched_at) = p_month)
    GROUP BY sl.user_id
  ) s ON p.user_id = s.user_id
  ORDER BY COALESCE(a.access_count, 0) + COALESCE(s.search_count, 0) DESC;
$$;