import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
            </div>

            <Link
                to="/"
                className="absolute top-6 left-6 z-10 flex items-center space-x-2 text-slate-300 hover:text-white transition-all duration-300 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg"
                title="Back to Selection"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold">Back</span>
            </Link>

            <div className="max-w-md w-full space-y-8 relative z-10 bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl">
                <div>
                    <div className="flex justify-center">
                        <div className="bg-red-500/20 p-4 rounded-2xl backdrop-blur-md border border-red-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-4xl font-black text-white tracking-tight">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        Secure access for system administrators
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-md text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                Admin Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                Access Key
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-red-600/20"
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verifying...</span>
                                </span>
                            ) : 'Sign in to Dashboard'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
