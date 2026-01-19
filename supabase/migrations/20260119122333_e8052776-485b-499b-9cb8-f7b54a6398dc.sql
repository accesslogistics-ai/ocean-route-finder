-- Change unique constraint to only destination (not destination+country)
-- This allows proper UPSERT behavior where same destination always maps to one country

-- First, drop any existing constraints on destination
ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_destination_country_key;
ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_destination_key;

-- Add new unique constraint on destination only
ALTER TABLE destinations ADD CONSTRAINT destinations_destination_unique UNIQUE (destination);