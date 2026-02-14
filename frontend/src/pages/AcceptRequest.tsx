import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requirementsService, hospitalService } from '../services/api';

const AcceptRequest = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const requestId = searchParams.get('id');

    useEffect(() => {
        if (!requestId) {
            navigate('/');
            return;
        }
        loadRequest();
    }, [requestId]);

    const loadRequest = async () => {
        try {
            // Fetch both requirements and hospital requests
            const source = searchParams.get('source');
            let found = null;

            if (source === 'hospital_requests') {
                const allHospitalRequests = await hospitalService.getAllRequests();
                found = allHospitalRequests.find((r: any) => r.id === requestId);
            } else {
                const allRequirements = await requirementsService.getAll();
                found = allRequirements.find((r: any) => r.id === requestId);
            }

            if (found) {
                setRequest(found);
            } else {
                alert('Request not found');
                navigate('/');
            }
        } catch (error) {
            console.error('Failed to load request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            // Redirect to login but keep the current URL as redirect back
            navigate(`/login?redirect=/accept-request?id=${requestId}`);
            return;
        }

        if (user.role !== 'STUDENT') {
            alert('Only students can accept blood requests.');
            return;
        }

        setSubmitting(true);
        try {
            if (request._source === 'hospital_requests') {
                await hospitalService.respondToRequest(requestId!, user.id);
            } else {
                await requirementsService.submitResponse(requestId!, user.id);
            }
            setSuccess(true);
        } catch (error: any) {
            console.error('Failed to submit response:', error);
            if (error.message?.includes('unique constraint') || error.message?.includes('duplicate key')) {
                alert('You have already accepted this request.');
                setSuccess(true);
            } else if (error.message?.includes('Could not find the table')) {
                alert('System Error: The database table "requirement_responses" is missing. Please run the "MASTER_DB_FIX.sql" script in Supabase.');
            } else {
                alert('Failed to accept request: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F3F0FF]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F3F0FF] px-6">
                <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-purple-100 rounded-[2.5rem] p-8 text-center shadow-2xl shadow-purple-200/20">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Thank You!</h2>
                    <p className="text-slate-400 mb-8 font-bold uppercase tracking-widest text-[10px]">Your willingness to donate has been registered. The admin/hospital will contact you soon.</p>
                    <button
                        onClick={() => navigate('/dashboard', { replace: true })}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95 text-[10px]"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F0FF] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            <button
                onClick={() => navigate('/', { replace: true })}
                className="fixed top-6 right-6 z-30 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
                title="Back to Selection"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>
            <div className="max-w-2xl w-full bg-white/70 backdrop-blur-xl border border-purple-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-200/20">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-center text-white">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Urgent Blood Request</h1>
                    <p className="text-red-50 font-black uppercase tracking-widest text-[10px] mt-1">A life needs your help today.</p>
                </div>

                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blood Group</p>
                            <p className="text-3xl font-black text-red-600">{request?.bloodGroup}</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Units Needed</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{request?.quantity} Units</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-5">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical Facility</p>
                                <p className="text-lg font-black text-slate-800 tracking-tight">{request?.hospitalName}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Identity</p>
                                <p className="text-lg font-black text-slate-800 tracking-tight">{request?.patientName || 'Anonymous Scholar'}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-5">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinical Scenario</p>
                                <p className="text-lg font-black text-slate-800 tracking-tight">{request?.treatmentType || 'Emergency'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="pt-6">
                            <button
                                onClick={handleAccept}
                                disabled={submitting}
                                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 text-[10px] ${submitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200 active:scale-95 animate-pulse'}`}
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Accept Donation Request</span>
                                    </>
                                )}
                            </button>
                            <p className="text-center text-slate-400 text-[10px] uppercase font-black tracking-widest mt-6 italic">By clicking accept, you commit to helping someone in need.</p>
                        </div>
                        <p className="text-center text-slate-500 text-[10px] uppercase font-black tracking-widest mt-4">By clicking accept, you commit to helping someone in need.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcceptRequest;
