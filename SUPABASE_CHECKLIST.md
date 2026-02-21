# 🚀 EcoTrack Supabase Setup Checklist

Complete this checklist step by step to set up your Supabase project from scratch.

## Phase 1: Supabase Project Creation ⚙️

### Step 1: Create Supabase Account & Project
- [ ] Go to https://supabase.com and sign up/login
- [ ] Click "New Project"
- [ ] Fill in:
  - [ ] Project Name: `earth-karma` (or your preferred name)
  - [ ] Database Password: Create a strong password and **save it somewhere safe**
  - [ ] Region: Choose closest to your location
- [ ] Click "Create new project"
- [ ] Wait 5-10 minutes for initialization ⏳
- [ ] You'll see "Project is being initialized..." → "Congratulations!"

### Step 2: Get Your Project Credentials
- [ ] Go to Project Settings (⚙️ at bottom left)
- [ ] Click "API" tab
- [ ] Save these values (you'll need them):
  - **Project URL** (looks like: `https://xxxxxxxxxxxx.supabase.co`)
  - **Project ID** (the `xxxxxxxxxxxx` part)
  - **anon/public key** (long string starting with `eyJ...`)
  - **service_role key** (another long string, keep this SECRET!)

### Step 3: Update Your .env File
- [ ] Edit `.env` in the root directory:
```
VITE_SUPABASE_PROJECT_ID="your_project_id_here"
VITE_SUPABASE_URL="https://your_project_id_here.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key_here"
GOOGLE_AI_KEY="your_google_ai_key_here"
```

### Step 4: Update supabase/config.toml
- [ ] Edit `supabase/config.toml`
- [ ] Change `project_id = "..."` to your actual project ID
- File should look like:
```toml
project_id = "your_project_id_here"

[functions.verify-activity-image]
verify_jwt = false

[functions.seed-admin]
verify_jwt = false

[functions.manage-user-status]
verify_jwt = false
```

---

## Phase 2: Setup Supabase CLI 📦

### Step 5: Install Supabase CLI
- [ ] Run in terminal:
```bash
npm install -g supabase
```
- [ ] Verify installation:
```bash
supabase --version
```

### Step 6: Login to Supabase with CLI
- [ ] Run:
```bash
supabase login
```
- [ ] This opens a browser window to authenticate
- [ ] Click "Authorize" when asked
- [ ] Return to terminal, you should see "✅ Logged in"

### Step 7: Link Your Project
- [ ] In terminal, navigate to project directory:
```bash
cd /workspaces/earth-karma-net-independent
```
- [ ] Link to your Supabase project:
```bash
# Option A (Interactive - recommended):
supabase link
# Select your project from the list when prompted

# Option B (Direct command):
supabase link --project-ref your_project_id_here
```
- [ ] You should see a success message confirming the link

---

## Phase 3: Database Setup 📊

### Step 8: Run Database Migrations
- [ ] Run migrations to create all tables:
```bash
supabase db push
```
- [ ] This will:
  - [ ] Create all tables (profiles, activities, events, etc.)
  - [ ] Create enums (app_role, activity_type, etc.)
  - [ ] Enable Row Level Security (RLS)
  - [ ] Create security functions
  - [ ] Create policies
- [ ] You should see output like: `✅ Applying 14 migration(s)`

### Step 9: Verify Database in Dashboard
- [ ] Go to https://supabase.com/dashboard
- [ ] Click on your project
- [ ] Go to "SQL Editor" in left menu
- [ ] Run this query to verify tables exist:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```
- [ ] You should see these tables:
  - [ ] activities
  - [ ] event_participants
  - [ ] events
  - [ ] profiles
  - [ ] rewards
  - [ ] user_rewards
  - [ ] user_roles
  - [ ] leaderboard
  - [ ] coupons
  - [ ] user_coupons

---

## Phase 4: Edge Functions Setup ⚡

### Step 10: Deploy Edge Functions
- [ ] Run these commands to deploy functions:
```bash
supabase functions deploy verify-activity-image --no-verify-jwt
supabase functions deploy seed-admin --no-verify-jwt
supabase functions deploy manage-user-status --no-verify-jwt
```
- [ ] You should see for each function:
  - `✅ Function deployed successfully`
  - Function URL (like: `https://xxx.supabase.co/functions/v1/function-name`)

### Step 11: Get Google AI API Key
- [ ] Go to https://aistudio.google.com/app/apikey
- [ ] Click "Create API Key"
- [ ] Click "Create API key in new project" (if you don't have a project)
- [ ] Copy the generated API key

### Step 12: Configure Edge Function Secrets
- [ ] Go to Supabase Dashboard → Your Project
- [ ] Go to "Settings" → "Functions" (in left menu under "Edge Functions")
- [ ] Scroll to "Function secrets"
- [ ] Add these secrets one by one (click "Add new secret"):

| Secret Name | Value |
|------------|-------|
| `GOOGLE_AI_KEY` | Your Google AI key from Step 11 |
| `ADMIN_EMAIL` | `admin@ecotrack.com` (or your email) |
| `ADMIN_PASSWORD` | Create a strong password |
| `SUPABASE_URL` | Your Supabase URL from Step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key from Step 2 |
| `SUPABASE_ANON_KEY` | Your anon/public key from Step 2 |

### Step 13: Verify Functions Deployed
- [ ] In Supabase Dashboard, go to "Edge Functions" (left menu)
- [ ] You should see three functions:
  - [ ] verify-activity-image
  - [ ] seed-admin
  - [ ] manage-user-status
- [ ] Click each one to verify they're running (no error logs)

---

## Phase 5: Create Admin User 👤

### Step 14: Seed Admin User
- [ ] Run in terminal:
```bash
curl -X POST "https://khxsnjioemhtktdrgyuq.supabase.co/functions/v1/seed-admin" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeHNuamlvZW1odGt0ZHJneXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDIwMTgsImV4cCI6MjA4NzIxODAxOH0.a0Hd_2ZGgcm7jAgMF70_hb3Rt3FaLMcOsmRokqJt52U" \
  -H "Content-Type: application/json"
```
- [ ] Replace:
  - `your_project_id` with your actual project ID
  - `your_anon_key` with your anon key from Step 2
- [ ] You should get a response like:
```json
{
  "message": "User seeded successfully",
  "userId": "uuid-here",
  "hasAdminRole": true
}
```

### Step 15: Verify Admin User in Dashboard
- [ ] Go to Supabase Dashboard → "Authentication" (left menu under "Auth")
- [ ] Click "Users"
- [ ] You should see your admin user with the email from Step 12
- [ ] Go to "SQL Editor" and run:
```sql
SELECT user_id, role FROM user_roles WHERE role = 'admin';
```
- [ ] You should see your admin user listed with role 'admin'

---

## Phase 6: Setup Frontend Environment 💻

### Step 16: Install Dependencies
- [ ] Run:
```bash
npm install
# or if using bun: bun install
```

### Step 17: Generate TypeScript Types
- [ ] Run:
```bash
supabase gen types typescript --project-id khxsnjioemhtktdrgyuq > src/integrations/supabase/types.ts
```
- [ ] This generates database types for TypeScript autocomplete
- [ ] Verify `src/integrations/supabase/types.ts` was updated

### Step 18: Update Supabase Client Configuration
- [ ] Check that `src/integrations/supabase/client.ts` looks correct:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## Phase 7: Testing 🧪

### Step 19: Start Development Server
- [ ] Run:
```bash
npm run dev
```
- [ ] Open http://localhost:5173 in your browser
- [ ] You should see the EcoTrack app loading

### Step 20: Test Authentication
- [ ] Click "Register"
- [ ] Create a test account
- [ ] You should be able to login
- [ ] Check Supabase Dashboard → "Authentication" to see the new user

### Step 21: Test Database
- [ ] Login with your test account
- [ ] Go to "Dashboard"
- [ ] Do something that saves to database (submit activity, join event, etc.)
- [ ] In Supabase Dashboard, go to "SQL Editor"
- [ ] Run query to verify data was saved:
```sql
SELECT * FROM activities LIMIT 10;
-- or
SELECT * FROM profiles WHERE user_id = 'your_user_id';
```

### Step 22: Test Image Verification
- [ ] Try to submit an activity with an image
- [ ] The backend should call Google Gemini to verify the image
- [ ] Check Edge Function logs:
  - Go to "Edge Functions" → Click "verify-activity-image"
  - You should see recent invocations in the logs
  - No red errors should appear

---

## Phase 8: Production Setup 🚀

### Step 23: Enable Row Level Security Policies
- [ ] Verify RLS is enabled in Supabase Dashboard:
  - Go to "Authentication" → "Policies" (in left menu)
  - You should see policies for each table
  - All should show "RLS enabled"

### Step 24: Configure Additional Auth Providers (Optional)
- [ ] Go to "Authentication" → "Providers"
- [ ] Enable additional login methods:
  - [ ] Google (recommended)
  - [ ] GitHub (recommended)
  - [ ] Discord (optional)
- [ ] For each, add credentials from that service

### Step 25: Set Production URLs
- [ ] In Supabase "Authentication" → "URL Configuration"
- [ ] Add your production domain:
```
Redirect URLs:
- http://localhost:5173/**
- https://yourdomain.com/**
- https://app.yourdomain.com/**
```

### Step 26: Build for Production
- [ ] Run:
```bash
npm run build
```
- [ ] Check that `dist/` folder is created with no errors
- [ ] Verify file size is reasonable (should be < 1MB)

---

## 🎉 Success Checklist

You're done when you can check ALL of these:

- [ ] ✅ Supabase project created
- [ ] ✅ .env file configured with correct credentials
- [ ] ✅ supabase/config.toml updated
- [ ] ✅ Supabase CLI installed and logged in
- [ ] ✅ Project linked via CLI
- [ ] ✅ Database migrations applied (all tables exist)
- [ ] ✅ Edge Functions deployed (no error logs)
- [ ] ✅ Edge Function secrets configured
- [ ] ✅ Admin user created
- [ ] ✅ Frontend dependencies installed
- [ ] ✅ Development server runs without errors
- [ ] ✅ Can register and login
- [ ] ✅ Database operations work
- [ ] ✅ Image verification works
- [ ] ✅ Can build for production

---

## 🆘 Troubleshooting

If you encounter issues, check:

### Migrations Failed
- [ ] Check if you linked the correct project ID
- [ ] Run `supabase db status` to see what's pending
- [ ] Check Supabase logs in Dashboard

### Functions Not Working
- [ ] Check function logs in Supabase Dashboard
- [ ] Verify all secrets are configured
- [ ] Make sure JWT verification is set to `false`

### Auth Not Working
- [ ] Verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are correct
- [ ] Check localStorage in browser console
- [ ] Check Supabase auth logs

### Database Queries Fail
- [ ] Check RLS policies: Dashboard → Authentication → Policies
- [ ] Verify user is authenticated before querying
- [ ] Check that foreign keys are being followed

### Image Verification Fails
- [ ] Check GOOGLE_AI_KEY is correct
- [ ] Check Edge Function logs
- [ ] Verify Google AI API has available quota
- [ ] Check rate limits (wait and retry after 60 seconds)

---

## ✅ Quick Reference Commands

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Check Supabase CLI status
supabase status

# View migration status
supabase db status

# Deploy functions
supabase functions deploy function-name --no-verify-jwt

# View function logs
supabase functions logs function-name

# Pull latest remote changes
supabase db pull

# Generate TypeScript types
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Test Edge Function
curl -X POST https://xxx.supabase.co/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

**You're all set! 🎉 Your EcoTrack app is ready for development and deployment!**
