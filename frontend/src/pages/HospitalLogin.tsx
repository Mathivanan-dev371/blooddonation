import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HospitalLogin = () => {
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
            navigate('/hospital/register');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faff] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Medical themed background elements */}
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                <svg className="w-96 h-96" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                </svg>
            </div>

            <Link
                to="/"
                className="absolute top-6 left-6 z-10 flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-all duration-300 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold">Back to Selection</span>
            </Link>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-indigo-50">
                    <div className="flex justify-center mb-8">
                        <div className="bg-indigo-50 p-4 rounded-3xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
                        Hospital Portal
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                        Secure login for medical facilities
                    </p>

                    <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Facility Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-5 py-4 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Access Key
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-5 py-4 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-300 shadow-xl shadow-indigo-200 uppercase tracking-widest"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Authorize Entry'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/hospital/register')}
                            className="w-full mt-4 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
                        >
                            Proceed without Login (Demo)
                        </button>
                    </form>
                </div>

                <p className="invisible h-0">
                    New facility? <Link to="/hospital-register" className="text-indigo-600 hover:underline font-bold">Register here</Link>
                </p>
                <p className="text-center text-slate-400 text-xs font-medium mt-2">
                    Need technical assistance? <a href="mailto:support@bloodline.org" className="text-indigo-600 hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default HospitalLogin;
