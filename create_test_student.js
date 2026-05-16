const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://srnkknpsmgqjkborjxtt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybmtrbnBzbWdxamtib3JqeHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg1Mzc1OSwiZXhwIjoyMDk0NDI5NzU5fQ.Vj4QV9-CQNyWw8g7076k2sh1MQ6fvnxZ-SoDOdJGhCY'
);

async function createStudent() {
  const email = 'test_student@skillbridge.com';
  const password = 'password123';

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Student',
      role: 'student',
    },
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  const userId = authData.user.id;

  // Insert profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: 'Test Student',
    role: 'student',
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Student created successfully. Email: test_student@skillbridge.com, Password: password123');
  }
}

createStudent();
