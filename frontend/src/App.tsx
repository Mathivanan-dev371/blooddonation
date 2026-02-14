import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AdminRequestHistory from './pages/AdminRequestHistory';
import AdminLogin from './pages/AdminLogin';
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegisterRequest from './pages/HospitalRegisterRequest';
import UserSelection from './pages/UserSelection';
import HospitalRequests from './pages/HospitalRequests';
import HospitalList from './pages/HospitalList';
import AcceptRequest from './pages/AcceptRequest';
import RequestResponses from './pages/RequestResponses';
import Layout from './components/Layout';
import BrandLogo from './components/BrandLogo';


function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role) && !allowedRoles.includes(user.role?.toUpperCase())) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/hospital-login" element={<HospitalLogin />} />
      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRoles={['STUDENT']}>
            <Layout>
              <Dashboard />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AdminPanel />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/history"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <AdminRequestHistory />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/hospitals"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <HospitalList />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/responses"
        element={
          <RoleRoute allowedRoles={['ADMIN']}>
            <RequestResponses />
          </RoleRoute>
        }
      />
      <Route
        path="/hospital"
        element={
          <RoleRoute allowedRoles={['HOSPITAL']}>
            <Layout>
              <HospitalRequests />
            </Layout>
          </RoleRoute>
        }
      />
      <Route
        path="/hospital/register"
        element={<HospitalRegisterRequest />}
      />
      <Route path="/accept-request" element={<AcceptRequest />} />
      <Route path="/" element={<UserSelection />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="fixed top-1.5 sm:top-2.5 left-3 sm:left-5 z-[150] pointer-events-none sm:pointer-events-auto flex items-center">
          <BrandLogo className="h-7 sm:h-12 md:h-14 w-auto drop-shadow-md brightness-100" />
        </div>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
