# Environment Variables Setup Guide

## ✅ What's Been Done

I've created the necessary `.env` files for your Blood Donation Management System:

1. **`.env.example`** - Template file (safe to commit to Git)
2. **`.env`** - Your actual environment variables (already in `.gitignore`)

## 🔧 Next Steps - Configure Your Supabase Credentials

You need to replace the placeholder values in the `.env` file with your actual Supabase credentials.

### Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one if you haven't already)
3. Click on the **Settings** icon (⚙️) in the left sidebar
4. Navigate to **API** section
5. You'll find two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys" - it's a long string)

### Step 2: Update Your `.env` File

1. Open `c:\Users\Arun\Desktop\bd\blooddonation\frontend\.env`
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Use the **anon public** key, NOT the service_role key
- The anon key is safe to use in frontend code
- Never commit the `.env` file to Git (it's already ignored)

### Step 3: Restart Your Development Server

After updating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 📁 File Structure

```
blooddonation/
├── frontend/
│   ├── .env                 # Your actual credentials (DO NOT COMMIT)
│   ├── .env.example         # Template (safe to commit)
│   ├── .gitignore           # Already configured to ignore .env
│   └── src/
│       └── services/
│           └── supabase.ts  # Uses environment variables
```

## 🔍 How It Works

The application uses Vite's environment variable system:

1. Variables prefixed with `VITE_` are exposed to your frontend code
2. They're accessed via `import.meta.env.VITE_VARIABLE_NAME`
3. The `supabase.ts` file already reads these variables:
   ```typescript
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

## ✅ Verification

To verify your setup is working:

1. Start the dev server: `npm run dev`
2. Open browser console (F12)
3. Try to register or login
4. If you see errors about "Invalid API key" or "supabaseUrl is required", your `.env` file needs to be updated

## 🛠️ Troubleshooting

### Error: "supabaseUrl is required"
- Your `.env` file is not being loaded
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart your dev server after creating/editing `.env`

### Error: "Invalid API key"
- Double-check you copied the **anon public** key correctly
- Make sure there are no extra spaces or line breaks
- Verify the key starts with `eyJ`

### Changes to `.env` not taking effect
- You must restart the dev server after changing `.env`
- Vite only reads environment variables at startup

## 🔒 Security Best Practices

✅ **DO:**
- Keep `.env` in `.gitignore` (already done)
- Use the anon public key in frontend
- Share `.env.example` with your team
- Use different credentials for development and production

❌ **DON'T:**
- Commit `.env` to Git
- Use the service_role key in frontend code
- Share your actual credentials publicly
- Hardcode credentials in your source code

## 📚 Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript Client Setup](https://supabase.com/docs/reference/javascript/initializing)
- See `SUPABASE_INTEGRATION_GUIDE.md` for complete Supabase setup

---

**Need help?** Check the `TROUBLESHOOTING.md` file or refer to the `SUPABASE_INTEGRATION_GUIDE.md` for detailed setup instructions.
