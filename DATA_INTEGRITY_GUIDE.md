# Data Integrity & Constraint Fix Guide

This guide helps you ensure that all database tables have proper Primary Keys (PK) and Foreign Keys (FK) set up correctly. This prevents "orphaned" data (e.g., a student record without a user profile) and ensures data consistency.

## 🛠️ How to Apply fixes

1.  **Open your Supabase Project Dashboard**.
2.  Go to the **SQL Editor** (icon on the left sidebar).
3.  Click **"New query"**.
4.  Copy the entire content of the file `ENSURE_DATA_INTEGRITY.sql` (located in your project root).
5.  Paste it into the SQL Editor.
6.  Click **Run**.

## 📝 What the Script Does

The script performs the following actions for each main table:

### 1. Profiles (`public.profiles`)
-   Ensures the `id` column is the Primary Key.

### 2. Student Details (`public.student_details`)
-   **Cleanup**: Removes any student detail records that don't have a matching Profile.
-   **Constraint**: Adds a Foreign Key linking `user_id` to `profiles(id)`.
-   **Action**: If a User Profile is deleted, their Student Details are automatically deleted (`ON DELETE CASCADE`).

### 3. Hospital Requests (`public.hospital_requests`)
-   **Cleanup**: Removes requests from non-existent hospitals.
-   **Constraint**: Links `hospital_id` to `profiles(id)`.
-   **Action**: If a Hospital Profile is deleted, their requests are automatically deleted.

### 4. Donation Attempts (`public.donation_attempts`)
-   **Cleanup**: Removes donation records for non-existent users.
-   **Constraint**: Links `user_id` to `profiles(id)`.
-   **Action**: If a User is deleted, their history is deleted.

### 5. Requirements & Responses (`public.blood_requirements`, `public.requirement_responses`)
-   **Cleanup**: Removes responses for deleted requirements or non-existent students.
-   **Constraint**: Links responses to both the Requirement and the Student Profile.

### 6. Hospital Response Tracking (`public.hospital_response_tracking`)
-   **Cleanup**: Removes tracking data for deleted requests.
-   **Constraint**: Links tracking to both the Hospital Request and the Student Profile.

## ✅ Verification

After running the script, you should see a success message in the results pane. You can then verify in the **Table Editor** that you can no longer insert invalid data (e.g., a `student_id` that doesn't exist).
