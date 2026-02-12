
-- Enable RLS
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Client Activity Log Table
CREATE TABLE IF NOT EXISTS client_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- 'Added', 'Modified', 'Deleted'
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
CREATE POLICY "Users can only see their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own activity" ON client_activity
  FOR ALL USING (auth.uid() = user_id);
