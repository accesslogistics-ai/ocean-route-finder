-- Add company column to email_whitelist
ALTER TABLE public.email_whitelist ADD COLUMN company TEXT;

-- Add company column to profiles
ALTER TABLE public.profiles ADD COLUMN company TEXT;