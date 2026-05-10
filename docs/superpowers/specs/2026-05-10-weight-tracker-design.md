# Weight Tracker — Design Spec

**Date:** 2026-05-10  
**User:** Sahasra, 15-year-old karate athlete, currently fighting 61+ category, cutting to 54 kg.

---

## Overview

A personal web app for tracking daily weight and training sessions, with a trend projection showing the estimated date to reach 54 kg, and a push notification reminder if weight hasn't been logged by a set time.

---

## Architecture

**Stack:** React + Vite (frontend SPA), Supabase (Postgres DB + auth + push), deployed to Vercel.

**Auth:** Supabase magic link (email). Single user — no multi-user complexity needed.

**Push notifications:** Web Push API via a Supabase Edge Function. A daily scheduled function checks if a weight entry exists for today; if not, it fires a browser push notification at the user's configured reminder time.

**Projection logic:** Linear regression over the last 14 days of weight entries produces a trend line and estimated arrival date at 54 kg target.

---

## Data Model

### `weight_entries`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | references auth.users |
| date | date | unique per user |
| weight_kg | numeric(4,1) | e.g. 58.4 |
| notes | text | optional |
| created_at | timestamptz | |

### `training_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | references auth.users |
| date | date | |
| type | text | one of: sparring, running, cardio, strength |
| duration_minutes | integer | |
| notes | text | optional |
| created_at | timestamptz | |

### `user_settings`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK FK | references auth.users |
| target_weight_kg | numeric(4,1) | default 54.0 |
| start_weight_kg | numeric(4,1) | for progress bar baseline |
| reminder_time | time | e.g. 21:00 |
| notifications_enabled | boolean | default false |
| push_subscription | jsonb | Web Push subscription object |

---

## Screens

### 1. Dashboard (Home)
- Greeting with user's name and today's date
- **Current weight card:** latest weight_kg, delta from previous entry, progress bar from start_weight to target (54 kg), kg remaining
- **Weight trend chart:** SVG line chart of last 30 days. Solid purple line = actual entries. Dashed green line = linear regression projection to 54 kg. Projected arrival date shown as a badge.
- **This week's training:** list of training sessions in the current week (type, duration, day)

### 2. Log Weight
- Date picker defaulting to today (allows past dates for backfilling)
- Numeric weight input (kg, one decimal place)
- Optional notes field
- Save button — upserts on (user_id, date)

### 3. Log Training
- Date picker defaulting to today
- Session type selector: Sparring / Running / Cardio / Strength (tap to select)
- Duration input (minutes)
- Optional notes field
- Save button

### 4. History
- Tabs: Weight | Training
- **Weight tab:** chronological list of all weight entries — date, weight, notes, delete action
- **Training tab:** chronological list of all sessions — date, type, duration, notes, delete action

### 5. Settings
- Target weight (default 54 kg)
- Start weight (for progress bar)
- Reminder time (time picker)
- Notifications toggle — triggers Web Push permission request on enable
- Sign out button

---

## Navigation

Bottom nav bar on mobile, top nav on desktop. Five tabs: Dashboard · Weight · Training · History · Settings.

---

## Push Notification Flow

1. User enables notifications in Settings → browser prompts for permission → Web Push subscription saved to `user_settings.push_subscription`.
2. Supabase Edge Function runs on a cron (every hour, checks current time against each user's `reminder_time`).
3. If the current hour matches `reminder_time` and no `weight_entries` row exists for today for that user → send push: *"Hey Sahasra — don't forget to log your weight today!"*

---

## Error & Edge Cases

- **No entries yet:** Dashboard shows empty state with a prompt to log first weight.
- **Fewer than 2 entries:** Projection chart shows actual points only, no trend line (can't regress on 1 point).
- **Duplicate date:** Log Weight upserts — saving weight for an already-logged date overwrites it.
- **Notification permission denied:** Settings shows a message explaining how to re-enable in browser settings.

---

## Out of Scope

- Multi-user / sharing
- Body measurements
- Calorie / food tracking
- Competition schedule management
