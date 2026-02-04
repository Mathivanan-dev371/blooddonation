# Supabase Integration Guide

This guide will help you complete the Supabase integration for the Blood Donation Management System.

## 📋 Prerequisites

- Node.js installed (v18 or higher)
- A Supabase account (free tier is sufficient)

## 🚀 Step-by-Step Integration

### Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Blood Donation System (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"** and wait for setup to complete (2-3 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the left sidebar
2. Navigate to **API** section
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
4. Keep this page open - you'll need these values in the next step

### Step 3: Configure Environment Variables

1. Navigate to the `frontend` folder:
   ```bash
   cd c:\Users\mohan\OneDrive\Desktop\bd\blooddonation\frontend
   ```

2. Create a `.env` file by copying the example:
   ```bash
   copy .env.example .env
   ```

3. Open the `.env` file and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Important**: Replace with your actual values from Step 2!

### Step 4: Set Up the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click **"New query"**
3. Open the `SUPABASE_SETUP.sql` file from your project root
4. Copy the entire contents and paste it into the Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see a success message

**What this does:**
- Creates all necessary tables (profiles, student_details, hospital_requests, donation_attempts)
- Sets up Row Level Security (RLS) policies
- Creates triggers for automatic profile creation
- Defines custom types (user_role, donation_status, request_status)

### Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email if needed
4. For development, you can disable email confirmation:
   - Go to **Authentication** → **Settings**
   - Under "Email Auth", toggle off **"Enable email confirmations"**

### Step 6: Install Dependencies

```bash
cd c:\Users\mohan\OneDrive\Desktop\bd\blooddonation\frontend
npm install
```

### Step 7: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to the URL shown (usually `http://localhost:5173`)

3. Try to register a new student account:
   - Fill in the registration form
   - Submit and check for any errors in the browser console

4. Verify in Supabase:
   - Go to **Authentication** → **Users** to see the new user
   - Go to **Table Editor** → **profiles** to see the profile created
   - Go to **Table Editor** → **student_details** to see student data

## 🔍 Verification Checklist

- [ ] Supabase project created
- [ ] `.env` file created with correct credentials
- [ ] Database schema executed successfully
- [ ] Email authentication enabled
- [ ] Dependencies installed
- [ ] Development server runs without errors
- [ ] Can register a new user
- [ ] User appears in Supabase dashboard

## 🛠️ Troubleshooting

### Error: "Invalid API key"
- Double-check your `.env` file has the correct `VITE_SUPABASE_ANON_KEY`
- Make sure you copied the **anon public** key, not the service role key
- Restart the dev server after changing `.env`

### Error: "Failed to create profile"
- Ensure you ran the `SUPABASE_SETUP.sql` script
- Check the SQL Editor for any errors
- Verify the trigger `on_auth_user_created` exists in **Database** → **Functions**

### Error: "Row Level Security policy violation"
- The RLS policies might not be set up correctly
- Re-run the `SUPABASE_SETUP.sql` script
- Check **Authentication** → **Policies** for each table

### Registration succeeds but no data in tables
- Check browser console for JavaScript errors
- Verify the trigger is working: **Database** → **Functions** → `handle_new_user`
- Check Supabase logs: **Logs** → **Postgres Logs**

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Next Steps

After successful integration:

1. **Create an Admin User**:
   - Register through the app
   - Go to Supabase **Table Editor** → **profiles**
   - Find your user and change `role` from `STUDENT` to `ADMIN`

2. **Test Hospital Registration**:
   - Use the hospital registration page
   - Verify hospital appears in profiles with role `HOSPITAL`

3. **Test Blood Requests**:
   - Login as hospital
   - Create a blood request
   - Verify it appears in the admin dashboard

4. **Configure Email Templates** (Optional):
   - Customize the email templates in Supabase
   - Set up SMTP for production emails

## 🔒 Security Notes

- **Never commit `.env` file to Git** (it's already in `.gitignore`)
- The **anon key** is safe to use in frontend code
- **Never use the service_role key** in frontend code
- For production, enable email confirmation
- Review and customize RLS policies based on your security requirements

---

**Need help?** Check the `TROUBLESHOOTING.md` file or create an issue in the repository.
