# Quick Setup Guide

## Prerequisites
- **Node.js v18+ installed** - [Download here](https://nodejs.org/) if not installed
- PostgreSQL database running
- npm (comes with Node.js)

> **⚠️ If Node.js is not installed:** See [NODEJS_INSTALLATION.md](NODEJS_INSTALLATION.md) for detailed installation instructions.

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm run install:all
```

**Note:** TypeScript errors in the seed script (and other files) are expected until dependencies are installed. These will automatically resolve after running `npm install`.

### 2. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE blooddonation;
```

### 3. Configure Environment Variables

Create `backend/.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/blooddonation?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Initialize Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed Database (Optional)

Create default admin and hospital users:
```bash
npm run seed
```

Default credentials:
- Admin: `admin` / `admin123`
- Hospital: `hospital` / `hospital123`

### 6. Start Development Servers

From the root directory:
```bash
npm run dev
```

Or run separately:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio (Database GUI): `cd backend && npm run prisma:studio`

## First Steps

1. Register a new student account
2. Login and explore the dashboard
3. Toggle your availability status
4. Use the seed script to create admin/hospital accounts, or manually update a user's role in the database

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `backend/.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `backend/.env`
- Update frontend proxy in `frontend/vite.config.ts`

### Prisma Errors
- Run `npm run prisma:generate` again
- Check database connection
- Verify schema.prisma syntax

## Production Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

3. Set production environment variables
4. Use a process manager like PM2 for Node.js
5. Serve frontend build with a web server (nginx, Apache)
