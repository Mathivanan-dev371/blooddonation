import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role) && !allowedRoles.includes(user.role?.toUpperCase())) {
    return <Navigate to="/dashboard" />;
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
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={<AdminPanel />}
      />
      <Route
        path="/admin/hospitals"
        element={<HospitalList />}
      />
      <Route
        path="/admin/responses"
        element={<RequestResponses />}
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
        <div className="fixed top-2 sm:top-5 left-2 sm:left-5 z-[100] pointer-events-none sm:pointer-events-auto">
          <BrandLogo className="h-10 sm:h-14 w-auto drop-shadow-md brightness-100" />
        </div>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
