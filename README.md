# College Blood Donor Management System

A comprehensive full-stack web application for managing student blood donors in a college environment. The system allows students to register and manage their availability, admins to manage users and trust scores, and hospitals to request blood and track donor reliability.

## 🚀 Features

### Student Features
- **Registration**: Secure registration with age validation (≥18 years)
- **Dashboard**: View trust score, blood group, and availability status
- **Availability Toggle**: Real-time update of availability status
- **Donation History**: View past donation attempts (successful, failed, cancelled)
- **Profile Management**: Edit limited profile fields (phone, department, year)

### Admin Features
- **User Management**: View, disable, and delete users
- **Trust Score Management**: Manual override of trust scores
- **Donation Statistics**: View comprehensive donation statistics
- **Filtering**: Filter users by role, blood group, availability, and trust score
- **Donation History**: View all donation attempts across the system

### Hospital Features
- **Blood Requests**: Create and manage blood requests
- **Donor Discovery**: View eligible available donors based on filters
- **Request Tracking**: Track request status and donor responses
- **Donor Assignment**: Assign donors to specific requests

### Trust Score System
- **Automatic Updates**: Trust score increases on successful donations (+10)
- **Penalty System**: Trust score decreases on failures (-15) and cancellations (-5)
- **Visibility Control**: Trust score affects donor visibility in filtering
- **Range**: 0-200 points

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

## 📋 Prerequisites

- **Node.js (v18 or higher)** - [Download here](https://nodejs.org/) if not installed
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)

> **⚠️ Important:** If you get "node is not recognized" error, Node.js is not installed. See [NODEJS_INSTALLATION.md](NODEJS_INSTALLATION.md) for installation instructions.

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blooddonation
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   - Create a PostgreSQL database
   - Copy `.env.example` to `.env` in the backend directory
   - Update `DATABASE_URL` in `backend/.env`:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/blooddonation?schema=public"
     JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
     PORT=5000
     NODE_ENV=development
     ```

4. **Run database migrations**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Create an admin user (optional)**
   You can create an admin user manually through the registration page, then update the role in the database:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE username = 'your-admin-username';
   ```

## 🚀 Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
blooddonation/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🔐 Authentication & Authorization

The system uses JWT-based authentication with role-based access control:

- **STUDENT**: Default role for registered users
- **ADMIN**: Full system access
- **HOSPITAL**: Can create requests and view eligible donors

## 🗄️ Database Schema

### Key Tables
- **User**: Authentication and user data
- **StudentDetails**: Student-specific information
- **DonationAttempt**: Records of donation attempts
- **HospitalRequest**: Blood requests from hospitals

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me/availability` - Update availability
- `PATCH /api/users/me/profile` - Update profile
- `GET /api/users/donors` - Get filtered donors
- `GET /api/users` - Get all users (Admin only)
- `PATCH /api/users/:id/trust-score` - Update trust score (Admin only)

### Donations
- `GET /api/donations/me` - Get user's donation history
- `GET /api/donations` - Get all donations (Admin only)
- `PATCH /api/donations/:id/status` - Update donation status
- `GET /api/donations/stats` - Get statistics (Admin only)

### Hospital Requests
- `POST /api/hospital/requests` - Create request (Hospital only)
- `GET /api/hospital/requests` - Get hospital's requests
- `GET /api/hospital/requests/:id/donors` - Get eligible donors
- `POST /api/hospital/requests/:id/assign` - Assign donors

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation (frontend and backend)
- Age validation (≥18 years)
- SQL injection protection via Prisma ORM

## 🧪 Testing

To test the application:

1. Register a student account
2. Login and check dashboard
3. Toggle availability
4. Create an admin user (via database)
5. Test admin panel features
6. Create a hospital user (via database)
7. Test hospital request features

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.
