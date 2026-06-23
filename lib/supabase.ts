
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://invcdkzjpkdyydunwewc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmNka3pqcGtkeXlkdW53ZXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzU4NjIsImV4cCI6MjA5NzgxMTg2Mn0.aPuZi6CEMlpAq-y6iUqXyfXQQ78qzKztkbhzKohFsNA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
