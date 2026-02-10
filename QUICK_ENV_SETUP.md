# 🚀 Quick Start - Environment Variables

## ⚡ Fast Setup (3 Steps)

### 1️⃣ Get Supabase Credentials
- Go to [supabase.com](https://supabase.com) → Your Project → Settings → API
- Copy **Project URL** and **anon public** key

### 2️⃣ Update .env File
```bash
# Open this file:
c:\Users\Arun\Desktop\bd\blooddonation\frontend\.env

# Replace with your actual values:
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Restart Dev Server
```bash
cd c:\Users\Arun\Desktop\bd\blooddonation\frontend
npm run dev
```

## ✅ Files Created

- ✅ `frontend/.env` - Your credentials (DO NOT COMMIT)
- ✅ `frontend/.env.example` - Template for team
- ✅ `ENV_SETUP_GUIDE.md` - Detailed instructions
- ✅ Enhanced `src/services/supabase.ts` - Better error messages

## 🔍 Verify It's Working

Open browser console - you should see:
- ✅ No errors = Working correctly
- ❌ "Missing Supabase credentials" = Update .env file
- ⚠️ "credentials not configured" = Replace placeholder values

## 📚 Need More Help?

- **Detailed Guide:** `ENV_SETUP_GUIDE.md`
- **Supabase Setup:** `SUPABASE_INTEGRATION_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

**Remember:** Always restart the dev server after editing `.env`!
