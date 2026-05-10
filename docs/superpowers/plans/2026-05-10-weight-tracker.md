# Weight Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal web app for karate athlete Sahasra to track daily weight and training sessions, with a 54 kg target projection and push notification reminders.

**Architecture:** React + Vite SPA with Supabase for auth, Postgres DB, and Edge Functions. All data is user-scoped via Supabase Row Level Security. Push notifications are delivered via Web Push API triggered by a scheduled Supabase Edge Function.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Supabase JS v2, Recharts, React Router v6, date-fns, Vitest, React Testing Library

---

## File Map

```
src/
  main.tsx                          # App entry point
  App.tsx                           # Router + auth gate
  types/index.ts                    # Shared TypeScript types
  lib/
    supabase.ts                     # Supabase client singleton
    regression.ts                   # Linear regression + projection
  hooks/
    useAuth.ts                      # Auth state + sign in/out
    useWeightEntries.ts             # CRUD for weight_entries
    useTrainingSessions.ts          # CRUD for training_sessions
    useUserSettings.ts              # Read/write user_settings
  components/
    nav/BottomNav.tsx               # Mobile bottom nav
    nav/TopNav.tsx                  # Desktop top nav
    auth/Login.tsx                  # Magic link sign-in screen
    dashboard/Dashboard.tsx         # Composes dashboard sections
    dashboard/WeightCard.tsx        # Current weight + progress bar
    dashboard/TrendChart.tsx        # Recharts line chart + projection
    dashboard/TrainingWeek.tsx      # This week's sessions list
    log/LogWeight.tsx               # Weight entry form
    log/LogTraining.tsx             # Training session form
    history/History.tsx             # Tabbed weight + training history
    settings/Settings.tsx           # Settings + notifications toggle
supabase/
  migrations/001_initial_schema.sql # All table definitions + RLS
  functions/weight-reminder/
    index.ts                        # Edge function: daily push notification
src/
  tests/
    regression.test.ts              # Unit tests for regression logic
    useWeightEntries.test.ts        # Hook tests with Supabase mock
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.example`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/shiva/repos/sahasra
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js react-router-dom recharts date-fns
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind — replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6366f1',
          green: '#22c55e',
          amber: '#f59e0b',
          pink: '#ec4899',
        },
        surface: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

- [ ] **Step 4: Add Tailwind directives — replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Configure Vitest — replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})
```

- [ ] **Step 6: Create test setup file — `src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 8: Create `.env.local`** (fill in real values after Supabase project is created in Task 2)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Tailwind + Vitest"
```

---

## Task 2: Supabase Project + Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com, create a new project called `sahasra`. Copy the project URL and anon key into `.env.local`.

- [ ] **Step 2: Write migration — `supabase/migrations/001_initial_schema.sql`**

```sql
-- weight_entries
create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(4,1) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table weight_entries enable row level security;
create policy "Users manage own weight entries"
  on weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- training_sessions
create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('sparring','running','cardio','strength')),
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now()
);
alter table training_sessions enable row level security;
create policy "Users manage own training sessions"
  on training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_settings
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_weight_kg numeric(4,1) not null default 54.0,
  start_weight_kg numeric(4,1),
  reminder_time time not null default '21:00',
  notifications_enabled boolean not null default false,
  push_subscription jsonb
);
alter table user_settings enable row level security;
create policy "Users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 3: Run migration in Supabase SQL editor**

Copy the contents of `001_initial_schema.sql` and run it in the Supabase dashboard → SQL Editor.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "chore: add Supabase schema migration"
```

---

## Task 3: Types + Supabase Client

**Files:**
- Create: `src/types/index.ts`, `src/lib/supabase.ts`

- [ ] **Step 1: Write types — `src/types/index.ts`**

```ts
export type SessionType = 'sparring' | 'running' | 'cardio' | 'strength'

export interface WeightEntry {
  id: string
  user_id: string
  date: string        // ISO date string "YYYY-MM-DD"
  weight_kg: number
  notes: string | null
  created_at: string
}

export interface TrainingSession {
  id: string
  user_id: string
  date: string
  type: SessionType
  duration_minutes: number
  notes: string | null
  created_at: string
}

export interface UserSettings {
  user_id: string
  target_weight_kg: number
  start_weight_kg: number | null
  reminder_time: string   // "HH:MM"
  notifications_enabled: boolean
  push_subscription: PushSubscriptionJSON | null
}
```

- [ ] **Step 2: Write Supabase client — `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/lib/supabase.ts
git commit -m "feat: add types and Supabase client"
```

---

## Task 4: Regression Logic (TDD)

**Files:**
- Create: `src/lib/regression.ts`, `src/tests/regression.test.ts`

- [ ] **Step 1: Write failing tests — `src/tests/regression.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { linearRegression, projectDate } from '../lib/regression'

describe('linearRegression', () => {
  it('returns slope and intercept for a simple dataset', () => {
    // y = 2x + 1
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ]
    const result = linearRegression(points)
    expect(result.slope).toBeCloseTo(2, 5)
    expect(result.intercept).toBeCloseTo(1, 5)
  })

  it('returns null for fewer than 2 points', () => {
    expect(linearRegression([{ x: 0, y: 58 }])).toBeNull()
    expect(linearRegression([])).toBeNull()
  })

  it('handles a declining weight trend', () => {
    const points = [
      { x: 0, y: 60 },
      { x: 7, y: 59.3 },
      { x: 14, y: 58.6 },
    ]
    const result = linearRegression(points)
    expect(result!.slope).toBeCloseTo(-0.1, 1)
  })
})

describe('projectDate', () => {
  it('returns projected date when target is reachable', () => {
    // slope: -0.1 kg/day, starting from day 0 at 58 kg, target 54
    // needs 40 more days from day 0
    const referenceDate = new Date('2026-05-10')
    const result = projectDate({ slope: -0.1, intercept: 58 }, 54, referenceDate, 0)
    expect(result).not.toBeNull()
    expect(result!.toISOString().slice(0, 10)).toBe('2026-06-19')
  })

  it('handles non-zero xOffset correctly', () => {
    // At day 10: y = -0.1*10 + 58 = 57. Need 30 more days to hit 54.
    const referenceDate = new Date('2026-05-20') // day 10 is May 20
    const result = projectDate({ slope: -0.1, intercept: 58 }, 54, referenceDate, 10)
    expect(result).not.toBeNull()
    expect(result!.toISOString().slice(0, 10)).toBe('2026-06-19')
  })

  it('returns null when slope is zero or positive (not losing weight)', () => {
    const referenceDate = new Date('2026-05-10')
    expect(projectDate({ slope: 0, intercept: 58 }, 54, referenceDate, 0)).toBeNull()
    expect(projectDate({ slope: 0.05, intercept: 58 }, 54, referenceDate, 0)).toBeNull()
  })

  it('returns null when already at or below target', () => {
    const referenceDate = new Date('2026-05-20')
    // At day 10: y = -0.1*10 + 54 = 53 < 54
    expect(projectDate({ slope: -0.1, intercept: 54 }, 54, referenceDate, 10)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/tests/regression.test.ts
```
Expected: FAIL — "Cannot find module '../lib/regression'"

- [ ] **Step 3: Implement regression — `src/lib/regression.ts`**

```ts
export interface RegressionResult {
  slope: number
  intercept: number
}

export function linearRegression(
  points: { x: number; y: number }[]
): RegressionResult | null {
  if (points.length < 2) return null

  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0)

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// Returns the projected calendar date when y = target, given regression line
// xOffset: the x-value corresponding to referenceDate (usually the last data point index)
export function projectDate(
  regression: RegressionResult,
  target: number,
  referenceDate: Date,
  xOffset: number
): Date | null {
  const { slope, intercept } = regression

  if (slope >= 0) return null
  const currentY = slope * xOffset + intercept
  if (currentY <= target) return null

  // Solve: slope * x + intercept = target  =>  x = (target - intercept) / slope
  const xTarget = (target - intercept) / slope
  const daysFromReference = Math.ceil(xTarget - xOffset)

  if (daysFromReference <= 0) return null

  const result = new Date(referenceDate)
  result.setDate(result.getDate() + daysFromReference)
  return result
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/tests/regression.test.ts
```
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/regression.ts src/tests/regression.test.ts
git commit -m "feat: add linear regression and projection logic with tests"
```

---

## Task 5: Auth Hook + Login Screen

**Files:**
- Create: `src/hooks/useAuth.ts`, `src/components/auth/Login.tsx`

- [ ] **Step 1: Write auth hook — `src/hooks/useAuth.ts`**

```ts
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error }
  }

  const signOut = () => supabase.auth.signOut()

  return { session, loading, signInWithEmail, signOut }
}
```

- [ ] **Step 2: Write Login screen — `src/components/auth/Login.tsx`**

```tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await signInWithEmail(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Sahasra</h1>
        <p className="text-slate-400 mb-8">Weight tracker</p>

        {sent ? (
          <div className="bg-surface-800 rounded-xl p-6 text-center">
            <p className="text-white font-semibold mb-2">Check your email</p>
            <p className="text-slate-400 text-sm">We sent a magic link to <span className="text-white">{email}</span></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors"
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire App.tsx — `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/auth/Login'
import { Dashboard } from './components/dashboard/Dashboard'
import { LogWeight } from './components/log/LogWeight'
import { LogTraining } from './components/log/LogTraining'
import { History } from './components/history/History'
import { Settings } from './components/settings/Settings'
import { BottomNav } from './components/nav/BottomNav'

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-surface-900 pb-20 md:pb-0 md:pt-16">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log-weight" element={<LogWeight />} />
        <Route path="/log-training" element={<LogTraining />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {session ? <AuthenticatedApp /> : <Login />}
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Update `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Run dev server to verify Login renders**

```bash
npm run dev
```
Open http://localhost:5173 — expect Login screen with email field.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add auth hook, login screen, and app router"
```

---

## Task 6: Navigation

**Files:**
- Create: `src/components/nav/BottomNav.tsx`, `src/components/nav/TopNav.tsx`

- [ ] **Step 1: Write BottomNav — `src/components/nav/BottomNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', icon: '📊', label: 'Home' },
  { to: '/log-weight', icon: '⚖️', label: 'Weight' },
  { to: '/log-training', icon: '🥋', label: 'Train' },
  { to: '/history', icon: '📅', label: 'History' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export function BottomNav() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-800 border-t border-surface-700 flex">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? 'text-brand-purple' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 bg-surface-800 border-b border-surface-700 px-6 h-16 items-center gap-6">
        <span className="text-white font-bold text-lg mr-4">Sahasra</span>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm transition-colors ${
                isActive ? 'text-brand-purple' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/nav/
git commit -m "feat: add bottom and top navigation"
```

---

## Task 7: Data Hooks

**Files:**
- Create: `src/hooks/useWeightEntries.ts`, `src/hooks/useTrainingSessions.ts`, `src/hooks/useUserSettings.ts`

- [ ] **Step 1: Write weight entries hook — `src/hooks/useWeightEntries.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { WeightEntry } from '../types'

export function useWeightEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const upsertEntry = async (entry: { date: string; weight_kg: number; notes?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('weight_entries')
      .upsert({ ...entry, user_id: user.id }, { onConflict: 'user_id,date' })

    if (!error) await fetchEntries()
    return { error }
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('weight_entries').delete().eq('id', id)
    if (!error) await fetchEntries()
    return { error }
  }

  return { entries, loading, upsertEntry, deleteEntry, refetch: fetchEntries }
}
```

- [ ] **Step 2: Write training sessions hook — `src/hooks/useTrainingSessions.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TrainingSession, SessionType } from '../types'

export function useTrainingSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const addSession = async (session: {
    date: string
    type: SessionType
    duration_minutes: number
    notes?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('training_sessions')
      .insert({ ...session, user_id: user.id })

    if (!error) await fetchSessions()
    return { error }
  }

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('training_sessions').delete().eq('id', id)
    if (!error) await fetchSessions()
    return { error }
  }

  return { sessions, loading, addSession, deleteSession, refetch: fetchSessions }
}
```

- [ ] **Step 3: Write user settings hook — `src/hooks/useUserSettings.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  target_weight_kg: 54.0,
  start_weight_kg: null,
  reminder_time: '21:00',
  notifications_enabled: false,
  push_subscription: null,
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettings(data)
    } else {
      // Create default settings row on first load
      const { data: created } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single()
      if (created) setSettings(created)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'user_id'>>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)

    if (!error) await fetchSettings()
    return { error }
  }

  return { settings, loading, updateSettings, refetch: fetchSettings }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add weight, training, and settings data hooks"
```

---

## Task 8: Log Weight Screen

**Files:**
- Create: `src/components/log/LogWeight.tsx`

- [ ] **Step 1: Write Log Weight screen — `src/components/log/LogWeight.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'

export function LogWeight() {
  const navigate = useNavigate()
  const { upsertEntry } = useWeightEntries()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight) return

    setSaving(true)
    setError('')
    const { error } = await upsertEntry({
      date,
      weight_kg: parseFloat(weight),
      notes: notes || undefined,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-6">Log Weight</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            step="0.1"
            min="30"
            max="200"
            placeholder="58.4"
            required
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
            Notes <span className="text-slate-600 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Morning, before food"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/log/LogWeight.tsx
git commit -m "feat: add log weight screen"
```

---

## Task 9: Log Training Screen

**Files:**
- Create: `src/components/log/LogTraining.tsx`

- [ ] **Step 1: Write Log Training screen — `src/components/log/LogTraining.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'
import type { SessionType } from '../../types'

const SESSION_TYPES: { type: SessionType; icon: string; label: string }[] = [
  { type: 'sparring', icon: '🥋', label: 'Sparring' },
  { type: 'running', icon: '🏃', label: 'Running' },
  { type: 'cardio', icon: '🚴', label: 'Cardio' },
  { type: 'strength', icon: '💪', label: 'Strength' },
]

export function LogTraining() {
  const navigate = useNavigate()
  const { addSession } = useTrainingSessions()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sessionType, setSessionType] = useState<SessionType | null>(null)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionType || !duration) return

    setSaving(true)
    setError('')
    const { error } = await addSession({
      date,
      type: sessionType,
      duration_minutes: parseInt(duration),
      notes: notes || undefined,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-6">Log Training</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Session Type</label>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSessionType(type)}
                className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                  sessionType === type
                    ? 'bg-brand-amber text-surface-900 border-2 border-brand-amber'
                    : 'bg-surface-800 text-slate-400 border-2 border-surface-700 hover:border-slate-500'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            max="480"
            placeholder="60"
            required
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-4 text-white text-2xl font-bold text-center focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">
            Notes <span className="text-slate-600 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Hard session, good cardio"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !sessionType}
          className="w-full bg-brand-amber text-surface-900 rounded-xl py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Session'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/log/LogTraining.tsx
git commit -m "feat: add log training screen"
```

---

## Task 10: Dashboard Components

**Files:**
- Create: `src/components/dashboard/WeightCard.tsx`, `src/components/dashboard/TrendChart.tsx`, `src/components/dashboard/TrainingWeek.tsx`, `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Write WeightCard — `src/components/dashboard/WeightCard.tsx`**

```tsx
import type { WeightEntry, UserSettings } from '../../types'

interface Props {
  entries: WeightEntry[]
  settings: UserSettings
}

export function WeightCard({ entries, settings }: Props) {
  const latest = entries[0]
  const previous = entries[1]
  const delta = latest && previous
    ? latest.weight_kg - previous.weight_kg
    : null

  const start = settings.start_weight_kg ?? (entries.at(-1)?.weight_kg ?? 0)
  const target = settings.target_weight_kg
  const current = latest?.weight_kg ?? start
  const progress = start === target ? 100 : Math.min(100, Math.max(0,
    ((start - current) / (start - target)) * 100
  ))
  const remaining = latest ? Math.max(0, latest.weight_kg - target) : null

  if (!latest) {
    return (
      <div className="bg-surface-800 rounded-2xl p-4">
        <p className="text-slate-400 text-sm text-center py-4">
          No weight logged yet —{' '}
          <a href="/log-weight" className="text-brand-purple underline">log your first entry</a>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current Weight</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-white text-5xl font-extrabold">{latest.weight_kg}</span>
        <span className="text-slate-400 text-lg">kg</span>
        {delta !== null && (
          <span className={`ml-auto text-sm px-3 py-1 rounded-lg font-medium ${
            delta <= 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {delta <= 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(1)} kg
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Start: {start} kg</span>
        <span>Target: {target} kg</span>
      </div>
      <div className="h-2 bg-surface-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-green transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {remaining !== null && (
        <p className="text-slate-400 text-xs text-center mt-2">
          {remaining === 0 ? 'Target reached!' : `${remaining.toFixed(1)} kg to go`}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write TrendChart — `src/components/dashboard/TrendChart.tsx`**

```tsx
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO, addDays } from 'date-fns'
import { linearRegression, projectDate } from '../../lib/regression'
import type { WeightEntry, UserSettings } from '../../types'

interface Props {
  entries: WeightEntry[]
  settings: UserSettings
}

export function TrendChart({ entries, settings }: Props) {
  if (entries.length === 0) return null

  const target = settings.target_weight_kg

  // Build last-30-days actual data (ascending by date)
  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const baseDate = parseISO(sorted[0].date)

  const actualPoints = sorted.map(e => ({
    x: Math.round((parseISO(e.date).getTime() - baseDate.getTime()) / 86400000),
    y: e.weight_kg,
    label: format(parseISO(e.date), 'MMM d'),
  }))

  const regression = linearRegression(actualPoints)
  const lastX = actualPoints.at(-1)!.x
  const projectedDate = regression
    ? projectDate(regression, target, parseISO(sorted.at(-1)!.date), lastX)
    : null

  // Build projection points
  const projectionPoints = regression && projectedDate
    ? [
        { x: lastX, y: actualPoints.at(-1)!.y, label: actualPoints.at(-1)!.label },
        {
          x: lastX + Math.round((projectedDate.getTime() - parseISO(sorted.at(-1)!.date).getTime()) / 86400000),
          y: target,
          label: format(projectedDate, 'MMM d'),
        },
      ]
    : []

  // Merge for chart
  const chartData = actualPoints.map(p => ({
    name: p.label,
    actual: p.y,
    projected: undefined as number | undefined,
  }))

  if (projectionPoints.length === 2) {
    chartData.push({
      name: projectionPoints[1].label,
      actual: undefined as unknown as number,
      projected: target,
    })
  }

  const allWeights = actualPoints.map(p => p.y)
  const yMin = Math.floor(Math.min(...allWeights, target) - 1)
  const yMax = Math.ceil(Math.max(...allWeights) + 1)

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-slate-400 text-xs uppercase tracking-widest">Weight Trend</p>
        {projectedDate && (
          <span className="text-xs bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-lg">
            On track for {format(projectedDate, 'MMM d')}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis domain={[yMin, yMax]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8', fontSize: 12 }}
            itemStyle={{ color: '#f1f5f9', fontSize: 13 }}
          />
          <ReferenceLine y={target} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Write TrainingWeek — `src/components/dashboard/TrainingWeek.tsx`**

```tsx
import { startOfWeek, parseISO, isAfter, isBefore, addDays, format } from 'date-fns'
import type { TrainingSession } from '../../types'

const TYPE_COLORS: Record<string, string> = {
  sparring: '#f59e0b',
  running: '#6366f1',
  cardio: '#ec4899',
  strength: '#22c55e',
}

const TYPE_ICONS: Record<string, string> = {
  sparring: '🥋',
  running: '🏃',
  cardio: '🚴',
  strength: '💪',
}

interface Props { sessions: TrainingSession[] }

export function TrainingWeek({ sessions }: Props) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  const thisWeek = sessions
    .filter(s => {
      const d = parseISO(s.date)
      return !isBefore(d, weekStart) && isBefore(d, weekEnd)
    })
    .slice(0, 5)

  return (
    <div className="bg-surface-800 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-slate-400 text-xs uppercase tracking-widest">This Week's Training</p>
        <span className="text-brand-purple text-xs">{thisWeek.length} session{thisWeek.length !== 1 ? 's' : ''}</span>
      </div>

      {thisWeek.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-3">No sessions yet this week</p>
      ) : (
        <div className="space-y-3">
          {thisWeek.map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: TYPE_COLORS[s.type] }}
              />
              <span className="text-white text-sm capitalize">
                {TYPE_ICONS[s.type]} {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
              </span>
              <span className="ml-auto text-slate-500 text-xs">
                {s.duration_minutes} min · {format(parseISO(s.date), 'EEE')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write Dashboard — `src/components/dashboard/Dashboard.tsx`**

```tsx
import { format } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'
import { useUserSettings } from '../../hooks/useUserSettings'
import { WeightCard } from './WeightCard'
import { TrendChart } from './TrendChart'
import { TrainingWeek } from './TrainingWeek'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { entries, loading: loadingW } = useWeightEntries()
  const { sessions, loading: loadingT } = useTrainingSessions()
  const { settings, loading: loadingS } = useUserSettings()

  const loading = loadingW || loadingT || loadingS

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto p-4 space-y-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">{format(new Date(), 'EEEE, MMM d')}</p>
          <h1 className="text-white text-xl font-bold">{getGreeting()}, Sahasra</h1>
        </div>
        <div className="w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
          S
        </div>
      </div>

      {settings && <WeightCard entries={entries} settings={settings} />}
      {settings && entries.length >= 2 && <TrendChart entries={entries} settings={settings} />}
      <TrainingWeek sessions={sessions} />
    </div>
  )
}
```

- [ ] **Step 5: Verify dashboard renders in browser**

```bash
npm run dev
```
Sign in via magic link. Expect Dashboard with empty states and no errors in console.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add dashboard with weight card, trend chart, and training week"
```

---

## Task 11: History Screen

**Files:**
- Create: `src/components/history/History.tsx`

- [ ] **Step 1: Write History screen — `src/components/history/History.tsx`**

```tsx
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useWeightEntries } from '../../hooks/useWeightEntries'
import { useTrainingSessions } from '../../hooks/useTrainingSessions'

const TYPE_ICONS: Record<string, string> = {
  sparring: '🥋',
  running: '🏃',
  cardio: '🚴',
  strength: '💪',
}

export function History() {
  const [tab, setTab] = useState<'weight' | 'training'>('weight')
  const { entries, deleteEntry } = useWeightEntries()
  const { sessions, deleteSession } = useTrainingSessions()

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-4">History</h2>

      <div className="flex gap-2 mb-4">
        {(['weight', 'training'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-brand-purple text-white'
                : 'bg-surface-800 text-slate-400 hover:text-white'
            }`}
          >
            {t === 'weight' ? '⚖️ Weight' : '🥋 Training'}
          </button>
        ))}
      </div>

      {tab === 'weight' && (
        <div className="space-y-2">
          {entries.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No weight entries yet</p>
          )}
          {entries.map(e => (
            <div key={e.id} className="bg-surface-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-white font-semibold">{e.weight_kg} kg</p>
                <p className="text-slate-400 text-xs">{format(parseISO(e.date), 'EEE, MMM d yyyy')}</p>
                {e.notes && <p className="text-slate-500 text-xs mt-0.5">{e.notes}</p>}
              </div>
              <button
                onClick={() => deleteEntry(e.id)}
                className="ml-auto text-slate-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Delete entry"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No training sessions yet</p>
          )}
          {sessions.map(s => (
            <div key={s.id} className="bg-surface-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-white font-semibold capitalize">
                  {TYPE_ICONS[s.type]} {s.type} · {s.duration_minutes} min
                </p>
                <p className="text-slate-400 text-xs">{format(parseISO(s.date), 'EEE, MMM d yyyy')}</p>
                {s.notes && <p className="text-slate-500 text-xs mt-0.5">{s.notes}</p>}
              </div>
              <button
                onClick={() => deleteSession(s.id)}
                className="ml-auto text-slate-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Delete session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/history/History.tsx
git commit -m "feat: add history screen with weight and training tabs"
```

---

## Task 12: Settings Screen

**Files:**
- Create: `src/components/settings/Settings.tsx`

- [ ] **Step 1: Write Settings screen — `src/components/settings/Settings.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useAuth } from '../../hooks/useAuth'

async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing.toJSON()

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  })
  return sub.toJSON()
}

export function Settings() {
  const { settings, updateSettings } = useUserSettings()
  const { signOut } = useAuth()
  const [targetWeight, setTargetWeight] = useState('')
  const [startWeight, setStartWeight] = useState('')
  const [reminderTime, setReminderTime] = useState('21:00')
  const [saving, setSaving] = useState(false)
  const [notifError, setNotifError] = useState('')

  useEffect(() => {
    if (settings) {
      setTargetWeight(String(settings.target_weight_kg))
      setStartWeight(settings.start_weight_kg ? String(settings.start_weight_kg) : '')
      setReminderTime(settings.reminder_time)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateSettings({
      target_weight_kg: parseFloat(targetWeight),
      start_weight_kg: startWeight ? parseFloat(startWeight) : null,
      reminder_time: reminderTime,
    })
    setSaving(false)
  }

  const handleNotificationsToggle = async () => {
    if (!settings) return
    setNotifError('')

    if (settings.notifications_enabled) {
      await updateSettings({ notifications_enabled: false })
      return
    }

    const sub = await subscribeToPush()
    if (!sub) {
      setNotifError(
        Notification.permission === 'denied'
          ? 'Notifications blocked. Enable them in browser settings.'
          : 'Push notifications not supported in this browser.'
      )
      return
    }
    await updateSettings({ notifications_enabled: true, push_subscription: sub })
  }

  if (!settings) return null

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-white text-xl font-bold mb-6">Settings</h2>

      <form onSubmit={handleSave} className="space-y-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Target Weight (kg)</label>
          <input
            type="number"
            value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)}
            step="0.1" min="30" max="200"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Starting Weight (kg)</label>
          <input
            type="number"
            value={startWeight}
            onChange={e => setStartWeight(e.target.value)}
            step="0.1" min="30" max="200"
            placeholder="Used for progress bar"
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Reminder Time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-purple text-white rounded-xl py-3 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <div className="bg-surface-800 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white font-semibold text-sm">Weight Reminders</p>
            <p className="text-slate-400 text-xs mt-0.5">Notify me if I haven't logged by {reminderTime}</p>
          </div>
          <button
            onClick={handleNotificationsToggle}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.notifications_enabled ? 'bg-brand-green' : 'bg-surface-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
              settings.notifications_enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
        {notifError && <p className="text-red-400 text-xs mt-2">{notifError}</p>}
      </div>

      <button
        onClick={signOut}
        className="w-full bg-surface-800 text-slate-400 rounded-xl py-3 font-semibold hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add VAPID public key to `.env.example`**

```
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/Settings.tsx .env.example
git commit -m "feat: add settings screen with notifications toggle"
```

---

## Task 13: Service Worker for Push Notifications

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write service worker — `public/sw.js`**

```js
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Sahasra', {
      body: data.body ?? "Don't forget to log your weight today!",
      icon: '/favicon.ico',
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
```

- [ ] **Step 2: Register service worker in `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Copy the public key into `.env.local` as `VITE_VAPID_PUBLIC_KEY` and save the private key — you'll need it for the Edge Function in the next task.

- [ ] **Step 4: Commit**

```bash
git add public/sw.js src/main.tsx
git commit -m "feat: add service worker for push notifications"
```

---

## Task 14: Push Notification Edge Function

**Files:**
- Create: `supabase/functions/weight-reminder/index.ts`

- [ ] **Step 1: Install Supabase CLI if not present**

```bash
brew install supabase/tap/supabase
```

- [ ] **Step 2: Write Edge Function — `supabase/functions/weight-reminder/index.ts`**

```ts
import webpush from 'npm:web-push@3'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = 'mailto:shivakrishna.k@gmail.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const now = new Date()
  const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
  const today = now.toISOString().slice(0, 10)

  // Find users whose reminder_time matches current hour and have notifications enabled
  const settingsRes = await fetch(
    `${supabaseUrl}/rest/v1/user_settings?notifications_enabled=eq.true&reminder_time=gte.${currentTime.slice(0,2)}:00&reminder_time=lt.${currentTime.slice(0,2)}:59&push_subscription=not.is.null`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  )
  const users = await settingsRes.json()

  for (const user of users) {
    // Check if they already logged weight today
    const logRes = await fetch(
      `${supabaseUrl}/rest/v1/weight_entries?user_id=eq.${user.user_id}&date=eq.${today}`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const logged = await logRes.json()
    if (logged.length > 0) continue

    try {
      await webpush.sendNotification(
        user.push_subscription,
        JSON.stringify({
          title: 'Sahasra',
          body: "Hey Sahasra — don't forget to log your weight today!",
        })
      )
    } catch (err) {
      console.error('Push failed for user', user.user_id, err)
    }
  }

  return new Response('ok')
})
```

- [ ] **Step 3: Set Edge Function secrets in Supabase dashboard**

Go to Supabase → Settings → Edge Functions → Secrets. Add:
- `VAPID_PUBLIC_KEY` — your VAPID public key
- `VAPID_PRIVATE_KEY` — your VAPID private key

- [ ] **Step 4: Deploy Edge Function**

```bash
supabase functions deploy weight-reminder --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your Supabase project reference ID (found in project settings).

- [ ] **Step 5: Set up cron in Supabase**

Go to Supabase → Database → Extensions, enable `pg_cron`. Then in SQL editor:

```sql
select cron.schedule(
  'weight-reminder-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weight-reminder',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with actual values.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add push notification edge function with hourly cron"
```

---

## Task 15: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/sahasra.git
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

Go to https://vercel.com → New Project → import GitHub repo `sahasra`.

- [ ] **Step 3: Add environment variables in Vercel dashboard**

Under Project → Settings → Environment Variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`

- [ ] **Step 4: Add your Vercel URL to Supabase Auth redirect list**

Go to Supabase → Authentication → URL Configuration. Add your Vercel URL (e.g. `https://sahasra.vercel.app`) to Redirect URLs.

- [ ] **Step 5: Verify production deploy**

Open your Vercel URL. Sign in with magic link. Log a weight entry. Confirm it appears on the dashboard.

- [ ] **Step 6: Add `.gitignore` entry**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore superpowers brainstorm files"
```

---

## Task 16: Run Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: regression tests pass. No failures.

- [ ] **Step 2: Manual smoke test checklist**

- [ ] Sign in via magic link
- [ ] Log weight for today
- [ ] Log weight for a past date (backfill)
- [ ] Log a training session
- [ ] Dashboard shows weight card with delta + progress bar
- [ ] Dashboard shows trend chart after 2+ entries
- [ ] History shows both tabs with delete working
- [ ] Settings saves target/start weight, progress bar updates
- [ ] Enable notifications — browser prompts for permission
- [ ] Sign out and back in — data persists

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and smoke test sign-off"
```
