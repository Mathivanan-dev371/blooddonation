import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementsService } from '../services/api';

const HospitalRegisterRequest = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [allRequirements, setAllRequirements] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        contactNumber: '',
        patientName: '',
        treatmentType: '',
        bloodGroup: '',
        quantity: 1
    });

    useEffect(() => {
        loadRequirements();
    }, []);

    const loadRequirements = async () => {
        try {
            const data = await requirementsService.getAll();
            setAllRequirements(data || []);
        } catch (error) {
            console.error('Failed to load requirements:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            await requirementsService.create({
                hospitalName: 'Partner Hospital',
                contactNumber: formData.contactNumber,
                patientName: formData.patientName,
                treatmentType: formData.treatmentType,
                bloodGroup: formData.bloodGroup,
                quantity: formData.quantity
            });
            alert('Requirement Registered Successfully! It is now visible to Admins.');
            setFormData({
                contactNumber: '',
                patientName: '',
                treatmentType: '',
                bloodGroup: '',
                quantity: 1
            });
            loadRequirements();
        } catch (err: any) {
            console.error('Failed to register request:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getTimeSinceActive = (lastActive: string) => {
        if (!lastActive) return 'Unknown';
        const diff = Date.now() - new Date(lastActive).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    return (
        <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden">
            {/* Content */}
            <div className="relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="fixed top-6 right-6 z-50 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
                    title="Back to Login"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                </button>

                <div className="max-w-screen-2xl mx-auto space-y-8 py-12 px-4 md:px-8">
                    {/* Registration Form */}
                    <div className="w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-purple-200/20 overflow-hidden border border-purple-100">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Blood Requirement Registration</h1>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-100">Broadcast to the SONA BLOODLINE</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                                    Submission Error. Please verify details and retry.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        Patient Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        value={formData.patientName}
                                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                        className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        Contact Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Emergency Phone"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                        Treatment / Purpose
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Surgery"
                                        value={formData.treatmentType}
                                        onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                                        className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            Blood Group
                                        </label>
                                        <select
                                            required
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800"
                                        >
                                            <option value="">Select</option>
                                            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                            Units
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                            className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 transition-all transform active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50 h-16 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Broadcasting...
                                        </span>
                                    ) : (
                                        'Register & Notify Admins'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* All Registered Requirements Table */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-purple-100 overflow-hidden shadow-2xl shadow-purple-200/10">
                        <div className="bg-purple-50/50 p-6 flex items-center justify-between border-b border-purple-100">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Live Registry Status</h2>
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">Verified</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-purple-50/30 border-b border-purple-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Group</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Age</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50">
                                    {allRequirements.length > 0 ? (
                                        allRequirements.map((req) => (
                                            <tr key={req.id} className="group hover:bg-purple-50/50 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-purple-50 text-indigo-600 font-black text-sm border border-purple-100 group-hover:scale-110 transition-transform">
                                                        {req.bloodGroup}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{req.patientName || 'Emergency'}</p>
                                                    <p className="text-[10px] font-black text-indigo-500 mt-0.5 uppercase tracking-widest">{req.treatmentType || 'Direct Account'}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-1">{req.contactNumber || 'System Entry'}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="text-sm font-black text-slate-800">{req.quantity}</span>
                                                    <span className="text-[10px] font-black text-slate-400 ml-1 uppercase">Units</span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    {req.status === 'Arranged' ? (
                                                        <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                                            Arranged
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wider border border-amber-100 animate-pulse">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-white border border-purple-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                                        {getTimeSinceActive(req.createdAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
                                                No active registry found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>


            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .animation-delay-6000 { animation-delay: 6s; }
            `}</style>
        </div>
    );
};

export default HospitalRegisterRequest;
