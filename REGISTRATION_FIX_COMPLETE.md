# Registration Issues - Complete Fix Guide

## Issues Encountered

### Issue 1: Foreign Key Constraint Violation ✅ FIXED
**Error:** `insert or update on table "student_details" violates foreign key constraint "student_details_user_id_fkey"`

### Issue 2: Duplicate Username Constraint ✅ FIXED
**Error:** `Profile creation failed: duplicate key value violates unique constraint "profiles_username_key"`

---

## Root Causes & Solutions

### Issue 1: Foreign Key Constraint
**Cause:** The code was only warning about profile creation failures instead of throwing an error, allowing the process to continue and try to insert student_details without a valid profile.

**Solution Applied:**
- Changed error handling in `Register.tsx` to throw an error if profile creation fails
- Ensures profile exists before inserting student_details

### Issue 2: Duplicate Username
**Cause:** The registration was using `formData.name` as the username, but multiple students can have the same name. The `profiles.username` column has a UNIQUE constraint.

**Solution Applied:**
- Changed username to use `formData.email` instead (emails are guaranteed unique)
- Added duplicate email checking before registration
- Enhanced validation to catch duplicates early

---

## Fixes Applied to Code

### 1. Register.tsx - Enhanced Duplicate Checking
```typescript
const checkDuplicates = async () => {
  // Check for duplicate email in profiles
  const { data: emailData } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', formData.email)
    .maybeSingle();

  if (emailData) {
    return 'An account with this email already exists';
  }

  // Check for duplicate admission number in student_details
  const { data: admissionData } = await supabase
    .from('student_details')
    .select('admission_number')
    .eq('admission_number', formData.admissionNumber)
    .maybeSingle();

  if (admissionData) {
    return 'A student with this admission number already exists';
  }

  return null;
};
```

### 2. Register.tsx - Use Email as Username
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    email: formData.email,
    username: formData.email, // Use email as username (guaranteed unique)
    role: 'STUDENT',
    is_active: true,
    is_available: true
  });
```

### 3. Register.tsx - Proper Error Handling
```typescript
if (profileError) {
  console.error('Profile creation failed:', profileError);
  throw new Error(`Profile creation failed: ${profileError.message}`);
}
```

---

## Database Fixes Required

### Step 1: Fix Foreign Key Constraints
Run `FIX_FOREIGN_KEY_CONSTRAINT.sql` in Supabase SQL Editor to:
- Clean up orphaned records
- Recreate foreign key constraints properly
- Set up correct RLS policies

### Step 2: Fix Duplicate Usernames
Run `FIX_DUPLICATE_USERNAMES.sql` in Supabase SQL Editor to:
- Update existing usernames to use email
- Remove any duplicate username conflicts
- Verify no duplicates remain

---

## How to Apply All Fixes

### 1. Database Fixes (Run in Supabase SQL Editor)
```sql
-- First, run this to fix foreign key constraints
-- Copy contents from: FIX_FOREIGN_KEY_CONSTRAINT.sql

-- Then, run this to fix duplicate usernames
-- Copy contents from: FIX_DUPLICATE_USERNAMES.sql
```

### 2. Frontend Fixes (Already Applied ✅)
The following changes have been made to `Register.tsx`:
- ✅ Enhanced duplicate checking (email + admission number)
- ✅ Changed username to use email instead of name
- ✅ Proper error handling for profile creation

### 3. Test Registration
1. Navigate to the registration page
2. Fill in all required fields
3. Try registering with:
   - A new email (should succeed)
   - An existing email (should show error: "An account with this email already exists")
   - An existing admission number (should show error: "A student with this admission number already exists")

---

## Validation Flow

The registration now follows this secure flow:

```
1. Client-side validation
   ↓
2. Check for duplicate email (in profiles)
   ↓
3. Check for duplicate admission number (in student_details)
   ↓
4. Create auth user (Supabase Auth)
   ↓
5. Create profile with email as username
   ↓ (MUST succeed or throw error)
6. Create student_details
   ↓
7. Show success message
```

---

## Files Modified/Created

### Modified
- ✅ `frontend/src/pages/Register.tsx` - Fixed duplicate checking and username handling

### Created
- 📄 `FIX_FOREIGN_KEY_CONSTRAINT.sql` - Database fix for foreign key issues
- 📄 `FIX_DUPLICATE_USERNAMES.sql` - Database fix for username duplicates
- 📄 `DIAGNOSTIC_FK_CHECK.sql` - Diagnostic queries (optional)
- 📄 `REGISTRATION_FIX_COMPLETE.md` - This guide

---

## Prevention Measures

### What We Fixed
1. **Duplicate Emails** - Now checked before registration
2. **Duplicate Admission Numbers** - Now checked before registration
3. **Duplicate Usernames** - Using email (guaranteed unique) instead of name
4. **Foreign Key Violations** - Profile creation must succeed before student_details insert
5. **Silent Failures** - All errors now throw and display to user

### Database Constraints
- `profiles.email` - UNIQUE (enforced)
- `profiles.username` - UNIQUE (enforced, now uses email)
- `student_details.admission_number` - UNIQUE (enforced)
- `student_details.user_id` - FOREIGN KEY to profiles(id) with CASCADE

---

## Troubleshooting

### If you still see "duplicate key" errors:
1. Run `FIX_DUPLICATE_USERNAMES.sql` in Supabase
2. Check if there are existing records with the same email
3. Try with a completely new email address

### If you see foreign key errors:
1. Run `FIX_FOREIGN_KEY_CONSTRAINT.sql` in Supabase
2. Run `DIAGNOSTIC_FK_CHECK.sql` to verify database state
3. Check Supabase logs for detailed error messages

### If registration still fails:
1. Open browser console (F12) to see detailed error messages
2. Check Supabase Dashboard → Authentication → Users
3. Check Supabase Dashboard → Table Editor → profiles and student_details
4. Share the exact error message for further assistance

---

## Success Indicators

After applying all fixes, you should see:
- ✅ New students can register successfully
- ✅ Duplicate emails are rejected with clear error message
- ✅ Duplicate admission numbers are rejected with clear error message
- ✅ Profile and student_details are created atomically
- ✅ No foreign key constraint violations
- ✅ No duplicate username violations

---

## Next Steps

1. **Run both SQL scripts** in Supabase SQL Editor (in order):
   - `FIX_FOREIGN_KEY_CONSTRAINT.sql`
   - `FIX_DUPLICATE_USERNAMES.sql`

2. **Test registration** with a new student account

3. **Verify** that duplicate detection works by trying to register twice with the same email

4. If everything works, you're all set! 🎉
