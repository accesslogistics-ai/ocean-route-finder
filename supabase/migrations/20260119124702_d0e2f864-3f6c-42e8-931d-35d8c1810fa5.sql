-- Create access_logs table
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
  ON public.access_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own access logs"
  ON public.access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_access_logs_accessed_at ON public.access_logs(accessed_at);

-- Create search_logs table
CREATE TABLE public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now(),
  carrier text,
  pol text,
  pod text,
  results_count integer
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all search logs"
  ON public.search_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_search_logs_user_id ON public.search_logs(user_id);
CREATE INDEX idx_search_logs_searched_at ON public.search_logs(searched_at);

-- Create RPC function for aggregated user activity
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  country text,
  access_count bigint,
  search_count bigint,
  last_access timestamptz
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
      AND EXTRACT(MONTH FROM al.accessed_at) = p_month
    GROUP BY al.user_id
  ) a ON p.user_id = a.user_id
  LEFT JOIN (
    SELECT 
      sl.user_id,
      COUNT(*) as search_count
    FROM search_logs sl
    WHERE EXTRACT(YEAR FROM sl.searched_at) = p_year
      AND EXTRACT(MONTH FROM sl.searched_at) = p_month
    GROUP BY sl.user_id
  ) s ON p.user_id = s.user_id
  ORDER BY COALESCE(a.access_count, 0) + COALESCE(s.search_count, 0) DESC;
$$;