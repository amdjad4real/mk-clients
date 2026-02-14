
-- Enable RLS
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;

-- Clients Table
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
  is_modified BOOLEAN DEFAULT FALSE, -- Flag for admin review
  payment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crucial: Ensure the column exists if the table was created previously
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='is_modified') THEN
    ALTER TABLE clients ADD COLUMN is_modified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Policies for Data Isolation
DROP POLICY IF EXISTS "Select isolation" ON clients;
DROP POLICY IF EXISTS "Insert own" ON clients;
DROP POLICY IF EXISTS "Update isolation" ON clients;
DROP POLICY IF EXISTS "Delete isolation" ON clients;

CREATE POLICY "Select isolation" ON clients FOR SELECT USING (
  (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR (auth.uid() = user_id)
);

CREATE POLICY "Insert own" ON clients FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Update isolation" ON clients FOR UPDATE USING (
  (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR (auth.uid() = user_id)
);

CREATE POLICY "Delete isolation" ON clients FOR DELETE USING (
  (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR (auth.uid() = user_id)
);
