import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requirementsService } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const AdminRequestHistory = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterHospital, setFilterHospital] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const allRequests = await requirementsService.getAll();

            // History includes COMPLETED, REJECTED, ARRANGED, etc.
            // Or just every request that is not "Pending" or "ASSIGNED"
            const history = allRequests.filter((r: any) =>
                r.status === 'COMPLETED' ||
                r.status === 'Arranged' ||
                r.status === 'REJECTED' ||
                r.status === 'Rejected' ||
                r.status === 'CANCELLED'
            );

            setRequests(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesHospital = req.hospitalName?.toLowerCase().includes(filterHospital.toLowerCase());
        const matchesStatus = filterStatus ? req.status === filterStatus : true;
        return matchesHospital && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">

            <div className="max-w-7xl mx-auto relative z-10">
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

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter mb-2 uppercase">Request History</h1>
                        <p className="text-purple-400 font-bold text-sm sm:text-lg">Archived Hospital Records</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Hospital Name..."
                                value={filterHospital}
                                onChange={(e) => setFilterHospital(e.target.value)}
                                className="bg-white border border-purple-100 text-slate-700 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none w-full sm:w-64 text-sm font-bold placeholder:text-slate-300 shadow-sm"
                            />
                            <svg className="w-4 h-4 text-purple-200 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white border border-purple-100 text-indigo-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none sm:w-48 text-sm font-black uppercase tracking-widest shadow-sm cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="Arranged">Arranged</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border border-purple-100 shadow-sm">
                        <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching history found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRequests.map((req) => (
                            <div key={req.id} className="bg-white rounded-[2.5rem] p-6 border border-purple-100 shadow-xl shadow-purple-200/10 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-2xl transition-all duration-300">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col max-w-[70%]">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">#{req.id.slice(0, 8)}</span>
                                            <h3 className="text-lg font-black text-slate-800 leading-tight uppercase line-clamp-1">{req.hospitalName}</h3>
                                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase">{formatDate(req.createdAt)}</p>
                                        </div>
                                        <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-purple-600 font-black text-lg">{req.bloodGroup}</span>
                                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter mt-1">Group</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center justify-between text-xs border-b border-purple-50 pb-3">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider">Patient</span>
                                            <span className="text-slate-700 font-black">{req.patientName || 'Emergency'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs border-b border-purple-50 pb-3">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider">Reason</span>
                                            <span className="text-indigo-600 font-black uppercase tracking-tight line-clamp-1">{req.purpose || req.treatmentType || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-wider">Units</span>
                                            <span className="text-slate-700 font-black">{req.quantity} Units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-purple-50 flex justify-between items-center">
                                    <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${(req.status === 'COMPLETED' || req.status === 'Arranged')
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : (req.status === 'REJECTED' || req.status === 'Rejected')
                                            ? 'bg-rose-50 text-rose-500 border-rose-100'
                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                        {req.status === 'COMPLETED' || req.status === 'Arranged' ? 'Completed' : req.status === 'REJECTED' || req.status === 'Rejected' ? 'Rejected' : req.status}
                                    </div>

                                    <Link
                                        to={`/admin/responses?requestId=${req.id}`}
                                        replace
                                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                                    >
                                        View Details →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRequestHistory;
