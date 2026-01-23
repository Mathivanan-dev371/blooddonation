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
import Layout from './components/Layout';


function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
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
      <Route path="/" element={<UserSelection />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
