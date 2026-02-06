import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hospitalService, requirementsService, userService } from '../services/api';

const RequestResponses = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const requestId = searchParams.get('id');
    const source = searchParams.get('source'); // 'hospital_requests' or 'blood_requirements'

    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestDetails, setRequestDetails] = useState<any>(null);

    useEffect(() => {
        if (!requestId) {
            navigate('/admin');
            return;
        }
        loadData();
    }, [requestId, source]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load responders
            let data = [];
            if (source === 'hospital_requests') {
                data = await hospitalService.getRequestResponders(requestId!);
                // Also fetch request details for header
                const allReqs = await hospitalService.getAllRequests();
                const found = allReqs.find((r: any) => r.id === requestId);
                setRequestDetails(found);
            } else {
                data = await requirementsService.getResponses(requestId!);
                // Fetch req details
                const allReqs = await requirementsService.getAll();
                const found = allReqs.find((r: any) => r._source === 'blood_requirements' && r.id === requestId);
                setRequestDetails(found);
            }

            setResponses(data || []);
        } catch (error) {
            console.error('Failed to load responses:', error);
            alert('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleArrivalStatus = async (responderId: string, studentId: string, status: string) => {
        const responder = responses.find(r =>
            source === 'hospital_requests' ? (r.student_id === studentId || r.student?.id === studentId) : r.id === responderId
        );

        // Prevent changing status if it's already set (Locked)
        if (responder?.arrival_status && responder.arrival_status !== 'Pending') {
            alert('Arrival status is already locked for this donor.');
            return;
        }

        let delta = 0;
        if (status === 'Arrived') {
            delta = 5;
        } else if (status === 'Not Arrived') {
            delta = -10;
        }

        try {
            if (source === 'hospital_requests') {
                await hospitalService.updateArrivalStatus(requestId!, studentId, status);
            } else {
                await requirementsService.updateArrivalStatus(responderId, status);
            }

            // Adjust points
            await userService.adjustTrustScore(studentId, delta);

            // Update local state
            setResponses(responses.map(r =>
                (source === 'hospital_requests' ? (r.student_id === studentId || r.student?.id === studentId) : r.id === responderId)
                    ? { ...r, arrival_status: status }
                    : r
            ));
            alert(`Status Locked! Trust Score ${delta > 0 ? '+' : ''}${delta} points applied.`);
        } catch (err) {
            console.error('Failed to update arrival status:', err);
            alert('Failed to update status.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-wider">Donor Responses</h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Request #{requestId?.slice(0, 8)} • {requestDetails?.bloodGroup}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-white leading-tight">Willing Scholars</h2>
                            <p className="text-slate-400 text-sm mt-1">Students who clicked "I Want to Donate"</p>
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <span className="text-emerald-400 font-black text-lg">{responses.length}</span>
                            <span className="text-emerald-500/70 text-xs uppercase font-bold ml-2">Responder{responses.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900/50 text-left">
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Department</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Contact Number</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Blood Group</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Action/Arrival</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {responses.map((resp: any) => {
                                    const student = resp.student;
                                    const details = student?.studentDetails || {};
                                    return (
                                        <tr key={resp.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="font-black text-white text-sm">{details.name || student.username || 'Unknown'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{details.admissionNumber}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-600">{details.department || 'N/A'}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="font-mono text-sm font-bold text-indigo-400">{details.phoneNumber || 'N/A'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-red-500 text-sm bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">{details.bloodGroup}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col items-center space-y-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${resp.arrival_status === 'Arrived'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : resp.arrival_status === 'Not Arrived'
                                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                        }`}>
                                                        {resp.arrival_status || 'Willing'}
                                                    </span>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleArrivalStatus(resp.id, student.id, 'Arrived')}
                                                            disabled={resp.arrival_status && resp.arrival_status !== 'Pending'}
                                                            className={`p-1.5 rounded-lg border transition-all ${resp.arrival_status === 'Arrived' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-emerald-400 hover:border-emerald-500/50'} ${resp.arrival_status && resp.arrival_status !== 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Mark as Arrived"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleArrivalStatus(resp.id, student.id, 'Not Arrived')}
                                                            disabled={resp.arrival_status && resp.arrival_status !== 'Pending'}
                                                            className={`p-1.5 rounded-lg border transition-all ${resp.arrival_status === 'Not Arrived' ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-rose-400 hover:border-rose-500/50'} ${resp.arrival_status && resp.arrival_status !== 'Pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title="Mark as Not Arrived"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {responses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-4 0 4 4 0 014 0z" /></svg>
                                                <p className="text-slate-400 font-bold text-sm">No students have responded yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestResponses;
