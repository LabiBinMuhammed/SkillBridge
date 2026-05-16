export type UserRole = "student" | "teacher" | "admin";
export type TaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";
export type SyllabusStatus = "on_track" | "lagging" | "completed" | "not_started";
export type TodoPriority = "critical" | "high" | "medium" | "low";
export type TodoType = "dream_task" | "syllabus_task" | "homework_task" | "custom";
export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type RankTitle = "novice" | "explorer" | "specialist" | "master" | "grandmaster";
export type CoinTransactionType = "earned" | "redeemed" | "bonus" | "penalty";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  roll_number?: string;
  department?: string;
  semester?: number;
  section?: string;
  phone?: string;
  bio?: string;
  coins: number;
  xp: number;
  energy_points: number;
  rank: RankTitle;
  level: number;
  streak_days: number;
  longest_streak: number;
  last_active_date?: string;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dream {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_system: boolean;
  created_by?: string;
  created_at: string;
  // Joined
  skills?: Skill[];
}

export interface StudentDream {
  id: string;
  student_id: string;
  dream_id: string;
  priority: number;
  energy_level: number;
  xp_earned: number;
  level: number;
  is_active: boolean;
  selected_at: string;
  // Joined
  dream?: Dream;
  progress_percentage?: number;
}

export interface Skill {
  id: string;
  dream_id: string;
  name: string;
  description?: string;
  icon: string;
  order_index: number;
  xp_reward: number;
  coin_reward: number;
  is_system: boolean;
  created_at: string;
  // Joined
  tasks?: Task[];
  student_progress?: StudentSkill;
}

export interface StudentSkill {
  id: string;
  student_id: string;
  skill_id: string;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  xp_earned: number;
  coins_earned: number;
}

export interface Task {
  id: string;
  skill_id: string;
  title: string;
  description?: string;
  instructions?: string;
  estimated_minutes: number;
  difficulty: number;
  xp_reward: number;
  coin_reward: number;
  energy_reward: number;
  requires_submission: boolean;
  requires_quiz: boolean;
  order_index: number;
  is_system: boolean;
  created_at: string;
  // Joined
  submission?: TaskSubmission;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  teacher_id?: string;
  status: TaskStatus;
  submission_text?: string;
  submission_url?: string;
  quiz_score?: number;
  quiz_passed?: boolean;
  feedback?: string;
  coins_awarded: number;
  xp_awarded: number;
  submitted_at: string;
  reviewed_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  department?: string;
  semester?: number;
  teacher_id?: string;
  total_hours: number;
  created_at: string;
  // Joined
  teacher?: Profile;
  latest_progress?: DailyProgress;
}

export interface WeeklyStudyPlan {
  id: string;
  subject_id: string;
  teacher_id: string;
  week_start: string;
  week_end: string;
  target_chapters: string[];
  target_topics: string[];
  target_pages_start?: number;
  target_pages_end?: number;
  planned_hours: number;
  notes?: string;
  created_at: string;
  // Joined
  subject?: Subject;
}

export interface DailyProgress {
  id: string;
  subject_id: string;
  teacher_id: string;
  plan_id?: string;
  date: string;
  topics_covered: string[];
  pages_covered_start?: number;
  pages_covered_end?: number;
  actual_hours: number;
  status: SyllabusStatus;
  lag_percentage: number;
  notes?: string;
  created_at: string;
  // Joined
  subject?: Subject;
}

export interface CCEAssignment {
  id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  type: string;
  due_date: string;
  max_marks: number;
  total_students: number;
  submitted_count: number;
  created_at: string;
  // Joined
  subject?: Subject;
  student_submission?: HomeworkSubmission;
}

export interface HomeworkSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at?: string;
  marks_obtained?: number;
  feedback?: string;
  status: string;
}

export interface StudentDailyTodo {
  id: string;
  student_id: string;
  date: string;
  generated_at: string;
  total_tasks: number;
  completed_tasks: number;
  coins_available: number;
  coins_earned: number;
  items?: TodoItem[];
}

export interface TodoItem {
  id: string;
  todo_id: string;
  student_id: string;
  type: TodoType;
  priority: TodoPriority;
  title: string;
  description?: string;
  estimated_minutes: number;
  coin_reward: number;
  xp_reward: number;
  is_completed: boolean;
  completed_at?: string;
  task_id?: string;
  assignment_id?: string;
  subject_id?: string;
  priority_score: number;
  is_auto_prioritized: boolean;
  created_at: string;
}

export interface CoinTransaction {
  id: string;
  student_id: string;
  type: CoinTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface CoinReward {
  id: string;
  title: string;
  description?: string;
  icon: string;
  cost: number;
  category: string;
  is_active: boolean;
  stock?: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  xp_bonus: number;
  coin_bonus: number;
  condition_type: string;
  condition_value: number;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
  semester?: number;
  coins: number;
  xp: number;
  level: number;
  rank: RankTitle;
  streak_days: number;
  tasks_completed: number;
  xp_rank: number;
  coin_rank: number;
  streak_rank: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Dashboard stats
export interface StudentStats {
  coins: number;
  xp: number;
  level: number;
  rank: RankTitle;
  streak: number;
  dreamsActive: number;
  tasksCompleted: number;
  tasksToday: number;
  completionRate: number;
  badges: number;
}
