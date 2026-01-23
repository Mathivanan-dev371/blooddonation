# Troubleshooting Guide

## "Cannot find module" or "Not found" Errors

### Issue: Module not found errors when running the server

**Common causes and solutions:**

#### 1. Dependencies not installed
```powershell
# Make sure you're in the backend directory
cd C:\Users\kanis\blooddonation\backend

# Install dependencies
npm install
```

#### 2. Running from wrong directory
**❌ Wrong:**
```powershell
# From root directory
node index.ts
```

**✅ Correct:**
```powershell
# From backend directory
cd C:\Users\kanis\blooddonation\backend
npm run dev
```

#### 3. TypeScript/Module resolution issues

If you get errors like:
- `Cannot find module 'cors'`
- `Cannot find module './routes/auth'`

**Solution:**
1. Make sure you're in the `backend` directory
2. Run `npm install` to ensure all dependencies are installed
3. Check that `node_modules` folder exists in `backend` directory
4. Try deleting `node_modules` and reinstalling:
   ```powershell
   cd backend
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

#### 4. Route files not found

If you get errors about route files:
- Verify files exist: `backend/src/routes/auth.ts`, `users.ts`, `donations.ts`, `hospital.ts`
- Check that all route files have `export default router;` at the end

#### 5. Prisma client not generated

If you get Prisma errors:
```powershell
cd backend
npm run prisma:generate
```

## Quick Fix Checklist

1. ✅ Node.js is installed (`node --version` should work)
2. ✅ You're in the `backend` directory
3. ✅ Dependencies are installed (`npm install` completed successfully)
4. ✅ All route files exist in `backend/src/routes/`
5. ✅ Prisma client is generated (`npm run prisma:generate`)

## Still having issues?

1. **Check the exact error message** - Copy the full error output
2. **Verify your current directory:**
   ```powershell
   Get-Location
   # Should show: C:\Users\kanis\blooddonation\backend
   ```

3. **Try a clean install:**
   ```powershell
   cd C:\Users\kanis\blooddonation\backend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json -ErrorAction SilentlyContinue
   npm install
   ```

4. **Check Node.js version:**
   ```powershell
   node --version
   # Should be v18.0.0 or higher
   ```

## Common Error Messages

### "Cannot find module 'cors'"
→ Run `npm install` in the backend directory

### "Cannot find module './routes/auth'"
→ Make sure you're running from `backend` directory, not root

### "MODULE_NOT_FOUND"
→ Check that you're using `npm run dev` (not `node index.ts`)

### "tsx: command not found"
→ Run `npm install` to install tsx
