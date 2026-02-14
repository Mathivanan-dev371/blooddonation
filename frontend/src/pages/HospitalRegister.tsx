import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import GlobalBackgroundSlideshow from '../components/GlobalBackgroundSlideshow';

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
            console.log('Attempting hospital registration:', formData.email);

            // Register with HOSPITAL role and additional details in metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
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

            if (authError) {
                console.error('Hospital SignUp Error:', authError);
                if (authError.message.includes('Error sending confirmation email')) {
                    setError('Account created, but there was an error sending the confirmation email. Please check your Supabase Email settings or disable "Confirm Email" in the Supabase Dashboard (Authentication -> Settings).');
                } else {
                    throw authError;
                }
            }

            console.log('Hospital Auth success:', authData);

            const successMsg = authError?.message.includes('Error sending confirmation email')
                ? "Account created! However, the confirmation email couldn't be sent. You might need to disable email confirmation in Supabase to login."
                : "verification mail is sent to your respective email,verify it !!";

            alert(successMsg);
            navigate('/hospital-login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden font-sans">
            <GlobalBackgroundSlideshow />
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                </button>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-purple-200/20 border border-purple-100">
                        <h2 className="text-center text-2xl font-black text-slate-800 tracking-tight uppercase">
                            Registration
                        </h2>
                        <p className="mt-2 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            Initialize Hospital Node
                        </p>

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Hospital
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold"
                                            placeholder="Name"
                                            value={formData.hospitalName}
                                            onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold"
                                            placeholder="City"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold"
                                        placeholder="Enter username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Facility Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold"
                                        placeholder="contact@network.org"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold tracking-widest"
                                            placeholder="••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                            Confirm
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            className="appearance-none relative block w-full px-5 py-3.5 bg-purple-50/30 border border-purple-100 placeholder-slate-400 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all sm:text-sm font-bold tracking-widest"
                                            placeholder="••••"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-5 px-4 border border-transparent text-[10px] font-black uppercase tracking-widest rounded-3xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-xl shadow-indigo-100 active:scale-95 h-16 items-center"
                            >
                                {loading ? 'Initializing...' : 'Register Hospital'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalRegister;
