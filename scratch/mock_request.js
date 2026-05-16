const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(); // Use ANON key to simulate student
const supabase = createClient(supabaseUrl, supabaseKey);

async function mockStudentRequest() {
  // Get a student id and a todo item id
  const serviceSupabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  
  const { data: student } = await serviceSupabase.from('profiles').select('id').eq('role', 'student').limit(1).single();
  const { data: todoItem } = await serviceSupabase.from('todo_items').select('id, title, coin_reward, xp_reward').limit(1).single();

  if (!student || !todoItem) {
    console.error('Could not find student or todo item');
    return;
  }

  console.log(`Mocking request for student ${student.id} and todo item ${todoItem.id}`);

  const { data, error } = await supabase.from('todo_approvals').insert({
    todo_item_id: todoItem.id,
    student_id: student.id,
    title: todoItem.title,
    coin_reward: todoItem.coin_reward,
    xp_reward: todoItem.xp_reward,
    status: 'pending'
  });

  if (error) {
    console.error('Error inserting into todo_approvals:', error);
  } else {
    console.log('Successfully inserted into todo_approvals:', data);
  }
}

mockStudentRequest();
