const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- Checking todo_approvals with student relation ---');
  const { data: approvals, error: approvalsError } = await supabase
    .from('todo_approvals')
    .select('*, student:profiles(full_name, department)')
    .eq('status', 'pending');
  
  if (approvalsError) console.error(approvalsError);
  else console.log(JSON.stringify(approvals, null, 2));

  console.log('\n--- Checking teacher_clubs ---');
  const { data: teacherClubs, error: tcError } = await supabase
    .from('teacher_clubs')
    .select('*');
  if (tcError) console.error(tcError);
  else console.log(JSON.stringify(teacherClubs, null, 2));

  console.log('\n--- Checking student_clubs ---');
  const { data: studentClubs, error: scError } = await supabase
    .from('student_clubs')
    .select('*');
  if (scError) console.error(scError);
  else console.log(JSON.stringify(studentClubs, null, 2));

  console.log('\n--- Checking leaderboard view ---');
  const { data: leaderboardData, error: lError } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(5);
  if (lError) console.error(lError);
  else console.log(JSON.stringify(leaderboardData, null, 2));

  // Also try to check if profiles has xp and coins directly to rank them
  const { data: profilesRank, error: prError } = await supabase
    .from('profiles')
    .select('id, full_name, role, xp, coins')
    .eq('role', 'student')
    .order('xp', { ascending: false })
    .limit(5);
  if (prError) console.error(prError);
  else console.log('\n--- Profiles ranked by XP ---', JSON.stringify(profilesRank, null, 2));
}

checkData();
