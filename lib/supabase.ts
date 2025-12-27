
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlaqtvtczktfwvtcdjxo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYXF0dnRjemt0Znd2dGNkanhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjY3NjksImV4cCI6MjA4MjQwMjc2OX0.Ml7kbAxlOIiY_gpWEb_yVSbNs1LVzi7FYSU71EtXM7Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
