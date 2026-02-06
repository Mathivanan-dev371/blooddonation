import { useState, useEffect } from 'react';
import { hospitalService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const HospitalRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [newRequest, setNewRequest] = useState({
    bloodGroup: '',
    quantity: 1,
    patientName: '',
    phoneNumber: '',
    age: '',
    purpose: '',
  });

  useEffect(() => {
    fetchRequests();

    // Set up Real-time subscription for automatic updates
    const channel = supabase
      .channel('hospital_requests_refresh')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hospital_requests'
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await hospitalService.getMyRequests(user?.id);

      // Filter out requests older than 12 hours
      const now = new Date().getTime();
      const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

      const recentRequests = (data || []).filter((req: any) => {
        const createdAt = new Date(req.createdAt).getTime();
        const age = now - createdAt;
        return age < twelveHoursInMs;
      });

      setRequests(recentRequests);
    } catch (error) {
      console.error('Failed to load requests', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!newRequest.bloodGroup || !newRequest.patientName || !newRequest.phoneNumber) {
        alert('Please fill in all required fields');
        return;
      }

      const requestData = {
        bloodGroup: newRequest.bloodGroup,
        quantity: newRequest.quantity,
        patientName: newRequest.patientName,
        phoneNumber: newRequest.phoneNumber,
        patientAge: parseInt(newRequest.age),
        purpose: newRequest.purpose,
        hospitalName: user?.hospital_name || 'Generic Request',
        hospitalAddress: user?.location || 'N/A',
        arrivalTime: new Date().toISOString()
      };

      await hospitalService.createRequest(requestData, user?.id);

      setNewRequest({ bloodGroup: '', quantity: 1, patientName: '', phoneNumber: '', age: '', purpose: '' });
      alert('Blood Request sent successfully!');
      fetchRequests(); // Refresh the list after creating
    } catch (error: any) {
      console.error('Failed to create request:', error);
      alert('Failed to send request: ' + error.message);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this blood request?')) return;
    try {
      await hospitalService.deleteRequest(requestId);
      alert('Request deleted successfully');
      // Remove from local state immediately for instant feedback
      setRequests(prev => prev.filter(req => req.id !== requestId));
      fetchRequests(); // Double check with fresh data
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      alert('Failed to delete request: ' + error.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 pb-12">

      <div className="relative z-10 space-y-6 md:space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-purple-100 shadow-xl shadow-purple-200/20 text-center md:text-left">
          <div className="order-2 md:order-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight uppercase leading-tight">Blood Request</h1>
            <p className="text-purple-400 font-bold text-xs md:text-[10px] tracking-[0.2em] mt-1 md:mt-2 uppercase">SONA BLOODLINE</p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden shadow-lg border-4 border-white transform hover:rotate-3 transition-transform">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpklT3qZjcOxuDyBvvkN_BgA4xIw_tXZKdXlYmpSOfTlI8fAnHiZDGbKc"
                alt="Hospital"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Centered Create Request Form */}
        <div className="w-full max-w-xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-purple-200/20 overflow-hidden border border-purple-100 hover:shadow-indigo-500/10 transition-shadow">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-10 text-white text-center">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider">Urgent Requirement</h3>
              <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mt-1">Direct alert to eligible scholars</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateRequest(); }} className="p-6 md:p-10 space-y-5 md:space-y-7">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Blood Group Needed</label>
                <select
                  value={newRequest.bloodGroup}
                  onChange={(e) => setNewRequest({ ...newRequest, bloodGroup: e.target.value })}
                  className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                  required
                >
                  <option value="">Select Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Units Required</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) })}
                  className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Patient Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newRequest.patientName}
                    onChange={(e) => setNewRequest({ ...newRequest, patientName: e.target.value })}
                    className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Contact Number</label>
                  <input
                    type="tel"
                    placeholder="Emergency No"
                    value={newRequest.phoneNumber}
                    onChange={(e) => setNewRequest({ ...newRequest, phoneNumber: e.target.value })}
                    className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Age</label>
                  <input
                    type="number"
                    placeholder="Years"
                    value={newRequest.age}
                    onChange={(e) => setNewRequest({ ...newRequest, age: e.target.value })}
                    className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Purpose</label>
                  <input
                    type="text"
                    placeholder="Reason"
                    value={newRequest.purpose}
                    onChange={(e) => setNewRequest({ ...newRequest, purpose: e.target.value })}
                    className="w-full px-6 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all font-bold text-sm outline-none text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 transition-all transform active:scale-95 uppercase tracking-widest text-[10px] mt-2 md:mt-4"
              >
                Broadcast Request
              </button>
            </form>
          </div>
        </div>


        {/* My Requests List */}
        <div className="max-w-4xl mx-auto mt-12 mb-12">
          <div className="flex items-center justify-between mb-8 px-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Request Logs</h2>
            <button
              onClick={fetchRequests}
              disabled={loadingRequests}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-purple-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
            >
              <svg className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent"></div></div>
          ) : requests.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-12 text-center border border-purple-100 shadow-xl shadow-purple-200/10">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No active broadcasting found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {requests.map((req: any) => (
                <div key={req.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl shadow-purple-200/10 border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center space-x-6 w-full md:w-auto">
                    <div className="h-16 w-16 bg-purple-50 rounded-2xl flex flex-col items-center justify-center border border-purple-100">
                      <span className="text-xl font-black text-indigo-600">{req.bloodGroup}</span>
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">Group</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 uppercase leading-none">{req.patientName || 'Emergency'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{req.quantity} Units</span>
                        <span className="text-slate-200 leading-none">|</span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">{req.purpose || 'Direct'}</span>
                        <span className="text-slate-200 leading-none">|</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider italic">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex items-center justify-end space-x-4">
                    <div className={`px-5 py-2 rounded-xl border font-black uppercase tracking-widest text-[9px] ${(req.status === 'Completed' || req.status === 'COMPLETED' || req.status === 'Arranged')
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : (req.status === 'Approved' || req.status === 'ASSIGNED')
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-lg shadow-indigo-100'
                        : (req.status === 'Rejected' || req.status === 'REJECTED')
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-amber-50 border-amber-100 text-amber-600'
                      }`}>
                      {req.status === 'COMPLETED' || req.status === 'Arranged' ? 'Arranged' : req.status === 'ASSIGNED' || req.status === 'Approved' ? 'Live' : req.status === 'REJECTED' || req.status === 'Rejected' ? 'Rejected' : req.status}
                    </div>

                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all border border-rose-100 group"
                      title="Withdraw Request"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default HospitalRequests;
