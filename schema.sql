
-- Ensure the clients table exists with the correct structure
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_number TEXT,
  dob DATE NOT NULL,
  passport_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  place_of_issue TEXT NOT NULL,
  previous_visa_number TEXT,
  visa_from DATE,
  visa_to DATE,
  category TEXT NOT NULL,
  appointment_date DATE,
  photo_url TEXT,
  is_modified BOOLEAN DEFAULT FALSE,
  payment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure column exists if table was already created
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='is_modified') THEN
    ALTER TABLE clients ADD COLUMN is_modified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clear any existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can select all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete all clients" ON clients;

-- Updated Policy Set for Proper Isolation
CREATE POLICY "Select isolation" ON clients
  FOR SELECT USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );

CREATE POLICY "Insert own" ON clients
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Update isolation" ON clients
  FOR UPDATE USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );

CREATE POLICY "Delete isolation" ON clients
  FOR DELETE USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );
