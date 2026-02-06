import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

const HospitalRegister = () => {
    const [formData, setFormData] = useState({
        hospitalName: '',
        location: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Register with HOSPITAL role and additional details in metadata
            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        role: 'HOSPITAL',
                        hospital_name: formData.hospitalName,
                        location: formData.location
                    }
                }
            });

            if (authError) throw authError;

            alert("verification mail is sent to your respective email,verify it !!");
            navigate('/hospital-login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faff] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Link
                to="/hospital-login"
                className="absolute top-6 left-6 z-10 flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-all duration-300 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold">Back to Login</span>
            </Link>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-indigo-50">
                    <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
                        Hospital Registration
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-500 font-medium lowercase">
                        Create a secure account for your medical facility
                    </p>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
                                {error}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Hospital Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                        placeholder="City General"
                                        value={formData.hospitalName}
                                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                        placeholder="Downtown"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                    placeholder="city_general"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Facility Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                    placeholder="contact@hospital.org"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Confirm
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-300 shadow-xl shadow-indigo-200 uppercase tracking-widest"
                        >
                            {loading ? 'Creating Account...' : 'Register Hospital'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HospitalRegister;
