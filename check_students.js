const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://srnkknpsmgqjkborjxtt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybmtrbnBzbWdxamtib3JqeHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg1Mzc1OSwiZXhwIjoyMDk0NDI5NzU5fQ.Vj4QV9-CQNyWw8g7076k2sh1MQ6fvnxZ-SoDOdJGhCY'
);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').eq('role', 'student');
  console.log('Student Profiles:', profiles);
  if (error) console.error('Error fetching profiles:', error);
}

check();
