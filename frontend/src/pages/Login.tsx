import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GlobalBackgroundSlideshow from '../components/GlobalBackgroundSlideshow';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role !== 'STUDENT') {
        const roleName = user.role.toLowerCase();
        logout();
        throw new Error(`This account is for ${roleName}s. Please use the ${roleName} portal.`);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <GlobalBackgroundSlideshow />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">

        <Link
          to="/"
          className="absolute top-6 right-6 z-50 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </Link>

        <div className="max-w-md w-full space-y-8 relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-purple-200/20 border border-purple-100">
          <div>
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
            <h2 className="text-center text-2xl font-black text-slate-800 tracking-tight uppercase">
              Scholar Login
            </h2>
            <p className="mt-2 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest">
              Identity Authorization
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[10px] text-center font-black uppercase tracking-wider">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Admission ID / Email
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-5 py-4 bg-purple-50/30 border border-purple-100 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm"
                  placeholder="Secure Identity"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Access Key
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-5 py-4 bg-purple-50/30 border border-purple-100 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm tracking-widest"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-5 px-4 border border-transparent text-[10px] font-black uppercase tracking-widest rounded-[2rem] text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-300 shadow-xl shadow-indigo-100 active:scale-95 h-16 items-center"
              >
                {loading ? (
                  <span className="flex items-center space-x-3">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying identity...</span>
                  </span>
                ) : 'Authorize Entry'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-purple-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                New to the network?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 transition-colors ml-1">
                  Initiate Enrollment
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
