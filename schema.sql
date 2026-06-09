
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
  deleted_at TIMESTAMP WITH TIME ZONE,
  payment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure updated_at exists if table was already created
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='updated_at') THEN
    ALTER TABLE clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- Automatic update trigger
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

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Updated Policy Set for Proper Isolation
DROP POLICY IF EXISTS "Select isolation" ON clients;
CREATE POLICY "Select isolation" ON clients
  FOR SELECT USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Insert own" ON clients;
CREATE POLICY "Insert own" ON clients
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Update isolation" ON clients;
CREATE POLICY "Update isolation" ON clients
  FOR UPDATE USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Delete isolation" ON clients;
CREATE POLICY "Delete isolation" ON clients
  FOR DELETE USING (
    (auth.jwt() ->> 'email' = 'admin@mkservice.com') OR 
    (auth.uid() = user_id)
  );
