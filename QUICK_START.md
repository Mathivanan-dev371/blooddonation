# Quick Start Guide

## Running the Backend Server

**❌ Wrong way (causes the error you're seeing):**
```powershell
# From root directory
node index.ts  # ❌ This looks for index.ts in root, but it's in backend/src/
```

**✅ Correct way:**

### Option 1: Using npm scripts (Recommended)
```powershell
# From root directory
cd backend
npm run dev
```

Or from root:
```powershell
# From root directory
npm run dev:backend
```

### Option 2: Using tsx directly
```powershell
# From backend directory
cd backend
npx tsx src/index.ts
```

## Important Notes

1. **Always run from the `backend` directory** or use the npm scripts from root
2. **The file is at:** `backend/src/index.ts` (not `index.ts` in root)
3. **Use `npm run dev`** - it uses `tsx` which can run TypeScript directly
4. **Make sure dependencies are installed first:**
   ```powershell
   cd backend
   npm install
   ```

## Complete Setup Steps

1. Install Node.js (if not done): See `NODEJS_INSTALLATION.md`
2. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
3. Run the server:
   ```powershell
   npm run dev
   ```

The server will start on `http://localhost:5000`
