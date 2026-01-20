-- Create email_whitelist table for pre-approved registrations
CREATE TABLE public.email_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  renewed_at TIMESTAMPTZ,
  created_by UUID,
  notes TEXT,
  CONSTRAINT email_whitelist_email_unique UNIQUE (email)
);

-- Create indexes for performance
CREATE INDEX idx_whitelist_email ON public.email_whitelist(LOWER(email));
CREATE INDEX idx_whitelist_expires ON public.email_whitelist(expires_at);

-- Enable RLS
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage whitelist
CREATE POLICY "Admins can manage whitelist"
ON public.email_whitelist
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create a function for public whitelist validation (used by edge function)
CREATE OR REPLACE FUNCTION public.check_whitelist_email(p_email TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  country TEXT,
  role app_role,
  expires_at TIMESTAMPTZ,
  is_valid BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    w.email,
    w.country,
    w.role,
    w.expires_at,
    (w.expires_at > now()) as is_valid
  FROM public.email_whitelist w
  WHERE LOWER(w.email) = LOWER(p_email)
  LIMIT 1;
$$;