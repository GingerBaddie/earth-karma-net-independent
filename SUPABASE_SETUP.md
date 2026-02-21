# Supabase Setup Guide - EcoTrack

Complete step-by-step guide to set up your Supabase project from scratch.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in with your account
3. Click **"New Project"** button
4. Fill in the details:
   - **Project Name**: `earth-karma` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the region closest to your users
5. Click **"Create new project"** and wait for initialization (5-10 minutes)

## Step 2: Get Your Project Credentials

After the project is created:

1. Go to **Project Settings** (⚙️ bottom left)
2. Click on **API** tab
3. Copy the following and add to your `.env` file:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** (keep this secret!) → For Edge Functions only
   - **Project ID** → `VITE_SUPABASE_PROJECT_ID`

4. Update your `.env` file:
```
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
```

## Step 3: Update Supabase Config

Update `supabase/config.toml` with your project ID:
```toml
project_id = "your_project_id"

[functions.verify-activity-image]
verify_jwt = false

[functions.seed-admin]
verify_jwt = false

[functions.manage-user-status]
verify_jwt = false
```

## Step 4: Run Database Migrations

The migrations in `supabase/migrations/` will create all the necessary tables and functions.

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
cd /workspaces/earth-karma-net-independent
supabase link --project-id your_project_id
```

4. Push migrations to your remote database:
```bash
supabase db push
```

### Option B: Manual SQL Execution

If CLI doesn't work, run migrations manually:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from each migration file in order:
   - `supabase/migrations/20260216062451_*.sql`
   - `supabase/migrations/20260216065343_*.sql`
   - `supabase/migrations/20260216070935_*.sql`
   - ... (continue with all migration files in chronological order)
5. Run each query one by one

## Step 5: Deploy Edge Functions

Edge Functions handle:
- **verify-activity-image**: Verifies activity photos using Google Gemini AI
- **seed-admin**: Creates an admin user
- **manage-user-status**: Manages user account status

### Deploy Using CLI:

```bash
# Make sure you're logged in and linked
supabase functions deploy verify-activity-image --no-verify-jwt
supabase functions deploy seed-admin --no-verify-jwt
supabase functions deploy manage-user-status --no-verify-jwt
```

### Deploy via Dashboard:

1. Go to **Edge Functions** in the dashboard
2. Click **Create a new function**
3. Copy the code from each function folder
4. Set JWT verification to `false` for each

## Step 6: Configure Edge Function Secrets

These secrets are environment variables for Edge Functions.

### In Supabase Dashboard:

1. Go to **Project Settings** → **Functions** → **Edge Function secrets**
2. Add these secrets:

```
GOOGLE_AI_KEY = your_google_ai_api_key
ADMIN_EMAIL = admin@ecotrack.com
ADMIN_PASSWORD = strong_password_here
SUPABASE_URL = your_supabase_url (from API settings)
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key (from API settings)
SUPABASE_ANON_KEY = your_anon_key (from API settings)
```

### Get Google AI API Key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key and add to Supabase secrets as `GOOGLE_AI_KEY`

## Step 7: Create Admin User

After deploying the `seed-admin` function:

1. Call the function to create an admin user:
```bash
curl -X POST https://your_project_id.supabase.co/functions/v1/seed-admin \
  -H "Authorization: Bearer your_anon_key"
```

Or use your frontend to call it:
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-admin`,
  { method: "POST" }
);
const data = await response.json();
console.log(data);
```

## Step 8: Configure Authentication (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Enable **Email** (usually enabled by default)
3. For social auth, enable: Google, GitHub, Discord (optional)
4. Configure redirect URLs:
   - Local: `http://localhost:5173/dashboard`
   - Production: `https://yourdomain.com/dashboard`

## Step 9: Enable Row Level Security (RLS) Policies

RLS is already enabled in migrations. Check the policies:

1. Go to **SQL Editor**
2. Run this to see policies:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

3. Verify policies exist for each table under **Authentication** → **Policies**

## Step 10: Test the Setup

1. Start development server:
```bash
npm install
npm run dev
```

2. Open `http://localhost:5173`
3. Try registering a new account
4. Submit an activity with image
5. Check if activity verification works

## Troubleshooting

### Migrations Not Applied
- Use CLI: `supabase db pull` to check current state
- If tables don't exist, run migrations again in order

### Edge Functions Not Working
- Check function logs: **Project Settings** → **Functions** → Click function name
- Verify all secrets are configured
- Make sure JWT verification is set to `false`

### Database Errors
- Check RLS policies aren't too restrictive
- Verify user_id is set correctly in session
- Check foreign key constraints

### Google Gemini Errors
- Verify `GOOGLE_AI_KEY` is correct
- Check quota on Google AI console
- Rate limits: Wait a moment and retry

## Environment Variables Summary

**.env** (Frontend)
```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
GOOGLE_AI_KEY=your_google_ai_key (optional for frontend)
```

**Supabase Secrets** (Edge Functions)
```
GOOGLE_AI_KEY=your_google_ai_key
ADMIN_EMAIL=admin@ecotrack.com
ADMIN_PASSWORD=strong_password
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema Overview

**Tables Created:**
- `profiles` - User profile information
- `user_roles` - User roles (citizen, organizer, admin)
- `activities` - Community activities with verification
- `events` - Community events
- `event_participants` - Event participation tracking
- `rewards` - Badge/reward definitions
- `user_rewards` - User reward tracking
- `leaderboard` - User points leaderboard
- `coupons` - Reward coupons
- `user_coupons` - User coupon redemption

**Enums Created:**
- `app_role` - citizen, organizer, admin
- `activity_type` - tree_plantation, cleanup, recycling, eco_habit
- `activity_status` - pending, approved, rejected

## Next Steps

1. ✅ Create Supabase project
2. ✅ Get credentials and update .env
3. ✅ Update supabase/config.toml
4. ✅ Run migrations
5. ✅ Deploy Edge Functions
6. ✅ Configure secrets
7. ✅ Create admin user
8. ✅ Test the app

You're ready to deploy! 🚀
