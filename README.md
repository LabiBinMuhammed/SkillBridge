# 🌉 Skill Bridge

> Unified Campus Intelligence & Gamification Engine

A full-stack Next.js application that transforms student career goals into daily actions, tracks academic progress in real-time, and rewards achievement through a gamified coin economy.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Set up database
# Paste contents of supabase/schema.sql into Supabase SQL Editor

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Custom |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Deployment | Vercel |

## 📁 Project Structure

```
skill-bridge/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── student/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx (Dashboard)
│   │   │   │   ├── dreams/page.tsx
│   │   │   │   ├── todo/page.tsx
│   │   │   │   ├── academic/page.tsx
│   │   │   │   ├── coins/page.tsx
│   │   │   │   ├── leaderboard/page.tsx
│   │   │   │   ├── badges/page.tsx
│   │   │   │   └── onboarding/page.tsx
│   │   │   ├── teacher/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx (Dashboard)
│   │   │   │   └── syllabus/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx (Dashboard)
│   │   ├── api/
│   │   │   ├── todo/generate/route.ts
│   │   │   ├── coins/route.ts
│   │   │   ├── dreams/route.ts
│   │   │   └── leaderboard/route.ts
│   │   ├── auth/callback/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx (Landing)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── dashboard/
│   │   │   └── Sidebar.tsx
│   │   ├── dreams/
│   │   │   └── DreamsClient.tsx
│   │   ├── todo/
│   │   │   └── TodoClient.tsx
│   │   ├── academic/
│   │   │   └── SyllabusClient.tsx
│   │   └── coins/
│   │       └── CoinsClient.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   └── schema.sql
├── .env.local.example
├── components.json
├── next.config.ts
├── tailwind.config.ts
└── vercel.json
```

## 🗄️ Database Schema

### Core Tables
- `profiles` — Extended user profiles with gamification fields
- `dreams` — Career path definitions (12 predefined + custom)
- `student_dreams` — Student dream selections with priority
- `skills` — Skills within each dream
- `student_skills` — Student progress per skill
- `tasks` — Tasks within each skill
- `task_submissions` — Student task submissions + teacher approvals

### Academic Tables
- `subjects` — Campus subjects by department
- `weekly_study_plans` — Teacher's weekly planning
- `daily_progress` — Daily syllabus progress logs
- `cce_assignments` — Homework and assignments
- `homework_submissions` — Student submission tracking

### Productivity Tables
- `student_daily_todos` — Daily todo list headers
- `todo_items` — Individual task items

### Economy Tables
- `coin_transactions` — Full coin audit trail
- `coin_rewards_catalog` — Redeemable rewards
- `coin_redemptions` — Redemption requests

### Gamification Tables
- `badges` — 8 system badges with rarity levels
- `student_badges` — Earned badges

### Views
- `leaderboard` — Materialized ranking view

## 🎮 Core Systems

### 1. Dream-Skill Engine
- Students select 5 prioritized career dreams
- Each dream → multiple skills → multiple tasks
- Task completion → XP + coins + energy points
- Dreams level up using energy points
- Priority #1 dream gets most AI-generated daily tasks

### 2. Academic Intelligence
- Teachers log daily syllabus progress
- System compares actual vs target hours
- Green/Red status indicators with lag percentage
- CCE homework tracking with due dates
- Lagging subjects trigger smart task prioritization

### 3. Autonomous To-Do Engine (`/api/todo/generate`)
- Combines dream tasks + syllabus catch-up + homework
- Smart priority scoring algorithm:
  - Homework due today = Critical (100 points)
  - Syllabus lag > 30% = auto-prioritized
  - Dream priority #1 = 50 points
- Reduces dream tasks when academics lag

### 4. Coin Economy
- Earn: task completion, streaks, quiz scores, homework
- Redeem: 8 campus rewards (library, events, privileges)
- Full transaction audit trail
- Admin approval workflow

## 🔐 Authentication & Authorization

- Supabase Auth with email/password
- Row Level Security (RLS) on all tables
- Role-based routing (student/teacher/admin)
- Auto-profile creation on signup via DB trigger

## 🎨 Theme

```
Background:  #050A05
Neon Green:  #00FF41
Neon Red:    #FF3131
Surface:     #0A1A0A
Card:        #0D1F0D
Border:      #1A3A1A
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Supabase Setup
1. Create new Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Enable Realtime for required tables
4. Configure Auth settings

## 📊 Rank System

| Rank | XP Required | Icon |
|------|------------|------|
| Novice | 0 | ⚡ |
| Explorer | 500 | 🌱 |
| Specialist | 2,000 | 💎 |
| Master | 5,000 | 🔥 |
| Grandmaster | 10,000 | 👑 |

## 🏅 Badge System

8 badges from Common to Legendary rarity, awarded automatically for streaks, task milestones, coin earnings, and rank achievements.
