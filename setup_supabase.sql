
-- ==========================================
-- SCHEMA REPAIR SCRIPT
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Create is_modified column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE;

-- 2. Create updated_at column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Sync existing data to prevent null issues
UPDATE clients SET is_modified = FALSE WHERE is_modified IS NULL;
UPDATE clients SET updated_at = created_at WHERE updated_at IS NULL;

-- 4. Setup automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. THE FIX: Force PostgREST to reload the schema cache
-- This command tells the API to "see" the new columns immediately.
NOTIFY pgrst, 'reload schema';
