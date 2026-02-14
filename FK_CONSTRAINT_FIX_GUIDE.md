# Foreign Key Constraint Violation Fix

## Problem
You encountered this error:
```
insert or update on table "student_details" violates foreign key constraint "student_details_user_id_fkey"
```

## Root Cause
The error occurs during student registration when trying to insert a record into `student_details` table. The foreign key constraint `student_details_user_id_fkey` requires that the `user_id` in `student_details` must exist in the `profiles` table first.

### Why It Was Happening
In `Register.tsx` (lines 107-121), the code was:
1. Creating a profile with `upsert`
2. **Only warning** if profile creation failed (not throwing an error)
3. Immediately trying to insert into `student_details`

If the profile creation failed or didn't complete, the subsequent `student_details` insert would fail with the foreign key constraint violation.

## Solution Applied

### 1. Frontend Fix (Register.tsx)
**Changed:** Profile creation error handling from warning to throwing an error.

**Before:**
```typescript
if (profileError) {
  console.warn('Profile creation warning:', profileError);
}
```

**After:**
```typescript
if (profileError) {
  console.error('Profile creation failed:', profileError);
  throw new Error(`Profile creation failed: ${profileError.message}`);
}
```

This ensures that:
- The profile **must** be created successfully before attempting to insert student details
- Any profile creation errors are caught and displayed to the user
- The registration process stops if the profile can't be created

### 2. Database Fix (FIX_FOREIGN_KEY_CONSTRAINT.sql)
Run this script in your Supabase SQL Editor to:
- Clean up any orphaned `student_details` records
- Recreate the foreign key constraint properly with CASCADE
- Set up correct RLS policies for registration

## How to Apply the Fix

### Step 1: Run the Database Fix
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_FOREIGN_KEY_CONSTRAINT.sql`
4. Click "Run"

### Step 2: Test Registration
The frontend code has already been updated. Try registering a new student:
1. Navigate to the registration page
2. Fill in all required fields
3. Submit the form

### Step 3: Verify (Optional)
Run `DIAGNOSTIC_FK_CHECK.sql` in Supabase SQL Editor to verify:
- Foreign key constraint is properly configured
- No orphaned records exist
- Table structures are correct

## Prevention
The fix ensures that:
1. **Profile creation is atomic** - Either it succeeds completely or fails with a clear error
2. **Foreign key integrity is maintained** - student_details can only reference existing profiles
3. **RLS policies are correct** - Authenticated users can insert their own records
4. **Error messages are clear** - Users see meaningful error messages if something fails

## Files Modified
- ✅ `frontend/src/pages/Register.tsx` - Fixed error handling
- 📄 `FIX_FOREIGN_KEY_CONSTRAINT.sql` - Database fix script (run this in Supabase)
- 📄 `DIAGNOSTIC_FK_CHECK.sql` - Diagnostic queries (optional)

## Next Steps
1. **Run the SQL fix script** in Supabase SQL Editor
2. **Test registration** with a new student account
3. If you still encounter issues, run the diagnostic script and share the results
