-- Add new fields for the import functionality
ALTER TABLE public.tariffs 
ADD COLUMN IF NOT EXISTS commodity TEXT,
ADD COLUMN IF NOT EXISTS free_time_origin TEXT,
ADD COLUMN IF NOT EXISTS free_time_destination TEXT;