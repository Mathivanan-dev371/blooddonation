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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 relative overflow-hidden">
            {/* Animated Background Shapes */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-10 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000"></div>

                {/* Building Silhouettes */}
                <div className="absolute top-1/4 left-1/4 opacity-5">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="currentColor" className="text-indigo-600">
                        <rect x="20" y="60" width="40" height="140" />
                        <rect x="70" y="40" width="60" height="160" />
                        <rect x="140" y="80" width="40" height="120" />
                        <rect x="30" y="70" width="8" height="8" className="fill-white" />
                        <rect x="30" y="90" width="8" height="8" className="fill-white" />
                        <rect x="30" y="110" width="8" height="8" className="fill-white" />
                        <rect x="80" y="50" width="10" height="10" className="fill-white" />
                        <rect x="80" y="70" width="10" height="10" className="fill-white" />
                        <rect x="80" y="90" width="10" height="10" className="fill-white" />
                        <rect x="100" y="50" width="10" height="10" className="fill-white" />
                        <rect x="100" y="70" width="10" height="10" className="fill-white" />
                        <rect x="100" y="90" width="10" height="10" className="fill-white" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <button
                    onClick={() => navigate('/hospital-login')}
                    className="fixed top-6 right-6 z-30 flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-all duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-md"
                    title="Back to Login"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-semibold">Back</span>
                </button>

                <div className="max-w-screen-2xl mx-auto space-y-8 py-12 px-4 md:px-8">
                    {/* Registration Form */}
                    <div className="w-full bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">Blood Requirement Registration</h1>
                            <p className="mt-2 text-indigo-100 font-medium">Please provide the details to broadcast your requirement.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center">
                                    Failed to submit request. Please try again.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Patient Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Patient Name"
                                        value={formData.patientName}
                                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Contact Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Emergency Contact"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Treatment Type
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Surgery"
                                        value={formData.treatmentType}
                                        onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Blood Group
                                        </label>
                                        <select
                                            required
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                                        >
                                            <option value="">Select</option>
                                            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                            Units
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submiting Requirement...
                                        </span>
                                    ) : (
                                        'Register Requirement'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* All Registered Requirements Table */}
                    <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-widest">Registered Requirements</h2>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-50/50 border-b border-emerald-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Group</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Patient Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Quantity</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] text-right">Time Ago</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {allRequirements.length > 0 ? (
                                        allRequirements.map((req) => (
                                            <tr key={req.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-sm ring-2 ring-emerald-200/50 group-hover:scale-110 transition-transform">
                                                        {req.bloodGroup}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-sm font-black text-gray-900">{req.patientName || 'Unknown'}</p>
                                                    <p className="text-xs font-bold text-emerald-500 mt-0.5">{req.treatmentType || 'Emergency'}</p>
                                                    <p className="text-[10px] font-mono text-gray-400 mt-1">{req.contactNumber || 'No Contact'}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="text-sm font-black text-gray-900">{req.quantity}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Units</span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    {req.status === 'Arranged' ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                                                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Arranged
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-200 animate-pulse">
                                                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Not Ready
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider border border-gray-100">
                                                        {getTimeSinceActive(req.createdAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold italic">
                                                No requirements registered yet.
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
