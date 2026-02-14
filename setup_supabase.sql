
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
  payment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can select all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete all clients" ON clients;

CREATE POLICY "Authenticated users can select all clients" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all clients" ON clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all clients" ON clients
  FOR DELETE USING (auth.role() = 'authenticated');
