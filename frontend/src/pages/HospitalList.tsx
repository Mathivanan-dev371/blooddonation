import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface Hospital {
    id: string;
    name: string;
    location: string;
    email: string;
}

const HospitalList = () => {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editHospitalId, setEditHospitalId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        email: ''
    });

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const { data, error } = await supabase
                .from('hospitals')
                .select('id, name, location, email')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHospitals(data || []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            // Fallback/Demo data
            setHospitals([
                { id: '1', name: 'City General Hospital', location: 'Downtown, Sector 4', email: 'contact@citygeneral.com' },
                { id: '2', name: 'St. Mary Medical Center', location: 'Uptown, North Wing', email: 'admin@stmarys.org' },
                { id: '3', name: 'Apollo Speciality', location: 'Industrial Area, Block B', email: 'info@apollo.com' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editHospitalId) {
                // UPDATE MODE
                const { error } = await supabase
                    .from('hospitals')
                    .update({
                        name: formData.name,
                        location: formData.location,
                        email: formData.email
                    })
                    .eq('id', editHospitalId);

                if (error) throw error;
                alert('Hospital updated successfully!');
            } else {
                // CREATE MODE
                const { error } = await supabase
                    .from('hospitals')
                    .insert({
                        name: formData.name,
                        location: formData.location,
                        email: formData.email
                    });

                if (error) throw error;
                alert('Hospital registered successfully!');
            }

            resetForm();
            fetchHospitals();
        } catch (error: any) {
            console.error('Form submission error:', error);
            alert('Operation failed: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (hospital: Hospital) => {
        setFormData({
            name: hospital.name,
            location: hospital.location,
            email: hospital.email
        });
        setEditHospitalId(hospital.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditHospitalId(null);
        setFormData({ name: '', location: '', email: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Back Button */}
                <Link
                    to="/admin"
                    className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
                >
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm tracking-wide uppercase">Back to Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tight mb-2">Hospital Registry</h1>
                        <p className="text-slate-400 font-medium text-lg">Manage and expand your network of clinical facilities</p>
                    </div>
                    <button
                        onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                        className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${showAddForm
                            ? 'bg-slate-700 text-slate-300 border border-slate-600'
                            : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:scale-105 active:scale-95 shadow-red-600/20'
                            }`}
                    >
                        {showAddForm ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Cancel</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add New Hospital</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Unified Form (Add/Edit) */}
                {showAddForm && (
                    <div className="mb-12 animate-in slide-in-from-top duration-500">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-white font-black uppercase tracking-widest text-sm mb-8 flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-3 ${editHospitalId ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                {editHospitalId ? 'Update Hospital Records' : 'New Hospital Enrollment'}
                            </h2>

                            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hospital Identity</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Name"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Facility Location</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Location"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`${editHospitalId ? 'bg-amber-500' : 'bg-white'} text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl h-[46px] disabled:opacity-50 text-xs`}
                                >
                                    {isSubmitting ? '...' : editHospitalId ? 'Update' : 'Register'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid gap-6">
                    {hospitals.map((hospital) => (
                        <div
                            key={hospital.id}
                            className={`bg-slate-800/50 backdrop-blur-md border rounded-3xl p-8 hover:border-slate-500/50 transition-all group overflow-hidden relative ${editHospitalId === hospital.id ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10' : 'border-slate-700/50'}`}
                        >
                            {/* Background Accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] group-hover:bg-red-500/10 transition-colors"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center space-x-6">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform ${editHospitalId === hospital.id ? 'bg-amber-500/20 border-amber-500/50' : 'bg-slate-700/50 border-slate-600'}`}>
                                        <span className={`text-2xl font-black ${editHospitalId === hospital.id ? 'text-amber-500' : 'text-red-500'}`}>
                                            {hospital.name?.charAt(0) || 'H'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                                            {hospital.name}
                                        </h3>
                                        <div className="flex items-center text-slate-400 space-x-4">
                                            <div className="flex items-center space-x-2 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm font-semibold tracking-tight">{hospital.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6 md:border-l md:border-slate-700 md:pl-8">
                                    <div className="flex items-center space-x-4 bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-700/50">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] leading-tight mb-1">Operational Area</p>
                                            <p className="text-base font-bold text-slate-200">{hospital.location || 'Pending Setup'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleEditClick(hospital)}
                                        className="h-14 w-14 rounded-2xl bg-slate-700/30 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-all border border-slate-600 hover:border-amber-500/30 flex items-center justify-center group/btn"
                                    >
                                        <svg className="w-6 h-6 transform group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {hospitals.length === 0 && (
                        <div className="text-center py-20 bg-slate-800/30 rounded-[3rem] border border-dashed border-slate-700">
                            <div className="h-24 w-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 mb-2 uppercase tracking-tighter">Sentinel Registry Blocked</h3>
                            <p className="text-slate-500 font-medium">No medical facilities detected in the current sector.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HospitalList;
