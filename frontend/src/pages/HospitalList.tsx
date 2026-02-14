import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface Hospital {
    id: string;
    name: string;
    location: string;
    email: string;
    contact_number: string;
}

const HospitalList = () => {
    const navigate = useNavigate();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editHospitalId, setEditHospitalId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        email: '',
        contactNumber: ''
    });

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const { data, error } = await supabase
                .from('hospitals')
                .select('id, name, location, email, contact_number')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHospitals(data || []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            // Fallback/Demo data
            setHospitals([
                { id: '1', name: 'City General Hospital', location: 'Downtown, Sector 4', email: 'contact@citygeneral.com', contact_number: '0427-224455' },
                { id: '2', name: 'St. Mary Medical Center', location: 'Uptown, North Wing', email: 'admin@stmarys.org', contact_number: '0427-334466' },
                { id: '3', name: 'Apollo Speciality', location: 'Industrial Area, Block B', email: 'info@apollo.com', contact_number: '0427-445566' },
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
                const { error } = await supabase
                    .from('hospitals')
                    .update({
                        name: formData.name,
                        location: formData.location,
                        email: formData.email,
                        contact_number: formData.contactNumber
                    })
                    .eq('id', editHospitalId);

                if (error) throw error;
                alert('Hospital updated successfully!');
            } else {
                const { error } = await supabase
                    .from('hospitals')
                    .insert({
                        name: formData.name,
                        location: formData.location,
                        email: formData.email,
                        contact_number: formData.contactNumber
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
            email: hospital.email,
            contactNumber: hospital.contact_number
        });
        setEditHospitalId(hospital.id);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditHospitalId(null);
        setFormData({ name: '', location: '', email: '', contactNumber: '' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F3F0FF]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F0FF] px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/50 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/admin', { replace: true })}
                    className="fixed top-6 right-6 z-50 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Back</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter mb-2 uppercase">Hospital Registry</h1>
                        <p className="text-purple-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Institutional Network Management</p>
                    </div>
                    <button
                        onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                        className={`w-full md:w-auto flex items-center justify-center space-x-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl text-xs sm:text-sm ${showAddForm
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
                                <span>Add New Facility</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Unified Form */}
                {showAddForm && (
                    <div className="mb-12 animate-in slide-in-from-top duration-500">
                        <div className="bg-white/70 backdrop-blur-2xl border border-purple-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-purple-200/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-slate-800 font-black uppercase tracking-widest text-[10px] sm:text-xs mb-8 flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-3 ${editHospitalId ? 'bg-amber-500' : 'bg-red-600'}`}></span>
                                {editHospitalId ? 'Update Operational Records' : 'New Strategic Enrollment'}
                            </h2>

                            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 items-end relative z-10">
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Identity</label>
                                    <input
                                        type="text" required placeholder="Hospital Name"
                                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Location</label>
                                    <input
                                        type="text" required placeholder="District/Sector"
                                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Secure Email</label>
                                    <input
                                        type="email" required placeholder="admin@care.com"
                                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Emergency Lines</label>
                                    <input
                                        type="tel" required placeholder="Phone/Tel"
                                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                        value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit" disabled={isSubmitting}
                                    className={`w-full sm:col-span-2 lg:col-span-1 ${editHospitalId ? 'bg-amber-500' : 'bg-indigo-600'} text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 h-[52px] disabled:opacity-50 text-[10px]`}
                                >
                                    {isSubmitting ? '...' : editHospitalId ? 'Apply Update' : 'Initialize'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {hospitals.map((hospital) => (
                        <div
                            key={hospital.id}
                            className={`bg-white/70 backdrop-blur-md border rounded-[2rem] p-6 sm:p-8 hover:border-purple-200 transition-all group relative overflow-hidden shadow-xl shadow-purple-200/10 ${editHospitalId === hospital.id ? 'border-amber-500/40 ring-2 ring-amber-500/10' : 'border-purple-50'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] group-hover:bg-indigo-500/10"></div>

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center space-x-4 sm:space-x-6">
                                    <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center border transition-all ${editHospitalId === hospital.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-purple-50 border-purple-100'}`}>
                                        <span className={`text-xl sm:text-2xl font-black ${editHospitalId === hospital.id ? 'text-amber-500' : 'text-red-600'}`}>
                                            {hospital.name?.charAt(0) || 'H'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-red-500 transition-colors">
                                            {hospital.name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                                                <svg className="w-4 h-4 text-red-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
                                                <span>{hospital.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold">
                                                <svg className="w-4 h-4 text-emerald-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                <span>{hospital.contact_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between lg:justify-end gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-purple-50 pt-6 lg:pt-0 lg:pl-8">
                                    <div className="flex items-center space-x-4">
                                        <div className="hidden xs:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center bg-purple-50 rounded-2xl border border-purple-100">
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 leading-none">Sector</p>
                                            <p className="text-sm sm:text-base font-black text-slate-700">{hospital.location || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleEditClick(hospital)}
                                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-[1.5rem] bg-purple-50 hover:bg-amber-500 text-purple-400 hover:text-white transition-all border border-purple-100 flex items-center justify-center shadow-sm"
                                    >
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HospitalList;
