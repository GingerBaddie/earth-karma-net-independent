# 🚀 QUICK START - Supabase Setup

## TL;DR - Get Running in 5 Minutes

### 1️⃣ Create Supabase Project (5 min)
```
Go to: https://supabase.com
Click: New Project
Fill: Name, Password, Region
Wait: 5-10 minutes for initialization
```

### 2️⃣ Copy Your Credentials
```
Dashboard → Settings → API
Find:
- Project URL: https://YOUR_ID.supabase.co
- Project ID: YOUR_ID
- anon key: eyJ...
- service_role key: (keep secret!)
```

### 3️⃣ Update Local .env
```bash
VITE_SUPABASE_PROJECT_ID="YOUR_ID"
VITE_SUPABASE_URL="https://YOUR_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
GOOGLE_AI_KEY="get from aistudio.google.com"
```

### 4️⃣ Update supabase/config.toml
```toml
project_id = "YOUR_ID"
```

### 5️⃣ Install CLI & Login
```bash
npm install -g supabase
supabase login
cd /workspaces/earth-karma-net-independent
supabase link --project-id YOUR_ID
```

### 6️⃣ Apply Migrations & Deploy Functions
```bash
supabase db push
supabase functions deploy verify-activity-image --no-verify-jwt
supabase functions deploy seed-admin --no-verify-jwt
supabase functions deploy manage-user-status --no-verify-jwt
```

### 7️⃣ Configure Secrets in Supabase Dashboard
Go to: `Dashboard → Settings → Functions → Edge Function secrets`

Add:
```
GOOGLE_AI_KEY = (from aistudio.google.com)
ADMIN_EMAIL = admin@ecotrack.com
ADMIN_PASSWORD = strongpassword123
SUPABASE_URL = https://YOUR_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (from API settings)
SUPABASE_ANON_KEY = (from API settings)
```

### 8️⃣ Create Admin User
```bash
curl -X POST "https://YOUR_ID.supabase.co/functions/v1/seed-admin" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 9️⃣ Start Your App
```bash
npm install
npm run dev
```

---

## 🔑 Where to Find Each Credential

| What | Where |
|-----|-------|
| **Project ID** | Supabase Dashboard → URL (the `xxxxx` in https://xxxxx.supabase.co) |
| **Project URL** | Supabase Dashboard → Settings → API → Project URL |
| **Anon Key** | Supabase Dashboard → Settings → API → anon public |
| **Service Role Key** | Supabase Dashboard → Settings → API → service_role (⚠️ keep secret!) |
| **Google AI Key** | https://aistudio.google.com/app/apikey (click Create API Key) |

---

## ⚠️ Important Notes

1. **Keep service_role key secret!** Never commit it to git or share it
2. **Use service_role key only in Edge Functions**, not in frontend
3. **anon key is public**, it's safe to use in frontend
4. **Backup your admin password** - you'll need it to login
5. **Google AI API key is free** but has rate limits - monitor usage

---

## ✅ Verify Everything Works

After setup, test with:

```bash
# 1. Start dev server
npm run dev

# 2. Go to http://localhost:5173

# 3. Create an account

# 4. Go to Supabase Dashboard → Authentication → Users
# You should see your new user!

# 5. Try submitting an activity
# (Test database insert)

# 6. Check Edge Function logs
# Supabase Dashboard → Edge Functions → verify-activity-image → Logs
```

---

## 📋 Checklist Before Email Step

Before creating your first user/activity, ensure:

- [ ] .env file has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] supabase/config.toml has project_id set
- [ ] `supabase link` completed successfully
- [ ] `supabase db push` applied all migrations
- [ ] All 3 functions deployed successfully
- [ ] All 6 secrets configured in Supabase
- [ ] admin user seeded (curl command returned success)
- [ ] `npm install` completed
- [ ] `npm run dev` works without errors
- [ ] Browser can reach `http://localhost:5173`

---

## 🆘 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| CLI says "not authenticated" | Run `supabase login` |
| Link fails with "Project not found" | Verify project ID is correct |
| Migrations fail | Check that database is accessible; try running in Supabase SQL Editor manually |
| Functions don't deploy | Make sure you're logged in and linked |
| Edge functions return 404 | Wait 2 minutes after deploying; check Supabase Dashboard to confirm |
| Image verification fails | Check GOOGLE_AI_KEY is correct in secrets |
| App won't load data | Check .env has correct SUPABASE_URL and PUBLISHABLE_KEY |
| Can't login | Verify JWT secret is correct; check auth logs in dashboard |

---

## 📚 Full Documentation

For more details, see:
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Complete guide
- [SUPABASE_CHECKLIST.md](./SUPABASE_CHECKLIST.md) - Step-by-step checklist

---

**Any issues? Check the troubleshooting section in SUPABASE_SETUP.md! 🎉**
