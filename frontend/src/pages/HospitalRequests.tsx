import { useState, useEffect } from 'react';
import { hospitalService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const HospitalRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [newRequest, setNewRequest] = useState({
    bloodGroup: '',
    quantity: 1,
    patientName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchRequests();
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
        hospitalName: user?.hospital_name || 'Generic Request',
        hospitalAddress: user?.location || 'N/A',
        arrivalTime: new Date().toISOString()
      };

      await hospitalService.createRequest(requestData, user?.id);

      setNewRequest({ bloodGroup: '', quantity: 1, patientName: '', phoneNumber: '' });
      alert('Blood Request sent successfully!');
      fetchRequests(); // Refresh the list after creating
    } catch (error: any) {
      console.error('Failed to create request:', error);
      alert('Failed to send request: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen space-y-6 md:space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/50 shadow-xl text-center md:text-left">
        <div className="order-2 md:order-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight uppercase leading-tight">Blood Request</h1>
          <p className="text-slate-500 font-bold text-xs md:text-sm tracking-[0.2em] mt-1 md:mt-2">SCT HOSPITAL PORTAL</p>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform hover:rotate-3 transition-transform">
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
        <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 md:p-10 text-white text-center">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider">New Request</h3>
            <p className="text-red-100 text-xs md:text-sm font-medium mt-1">Fill details to notify available donors</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleCreateRequest(); }} className="p-6 md:p-10 space-y-5 md:space-y-7">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Blood Group Needed</label>
              <select
                value={newRequest.bloodGroup}
                onChange={(e) => setNewRequest({ ...newRequest, bloodGroup: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all font-bold text-base"
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
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Units (Quantity)</label>
              <input
                type="number"
                min="1"
                placeholder="Number of units"
                value={newRequest.quantity}
                onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Patient Name</label>
              <input
                type="text"
                placeholder="Full name of patient"
                value={newRequest.patientName}
                onChange={(e) => setNewRequest({ ...newRequest, patientName: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all font-bold text-base"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Emergency contact"
                value={newRequest.phoneNumber}
                onChange={(e) => setNewRequest({ ...newRequest, phoneNumber: e.target.value })}
                className="w-full px-5 md:px-6 py-3.5 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all font-bold text-sm md:text-base outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 md:py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl md:rounded-2xl shadow-xl shadow-red-200 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-xs md:text-sm mt-2 md:mt-4"
            >
              Send Request
            </button>
          </form>
        </div>


        {/* My Requests List */}
        <div className="max-w-4xl mx-auto mt-12 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight pl-4 border-l-4 border-red-500">My Requests Status</h2>
            <button
              onClick={fetchRequests}
              disabled={loadingRequests}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-2 border-red-500 rounded-full border-t-transparent"></div></div>
          ) : requests.length === 0 ? (
            <div className="bg-white/50 rounded-2xl p-8 text-center border border-slate-200">
              <p className="text-slate-400 font-bold">No requests history found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {requests.map((req: any) => (
                <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center space-x-6 w-full md:w-auto">
                    <div className="h-16 w-16 bg-red-50 rounded-2xl flex flex-col items-center justify-center border border-red-100">
                      <span className="text-xl font-black text-red-500">{req.bloodGroup}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Group</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 uppercase">{req.patientName || 'Unknown Patient'}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.quantity} Units</span>
                        <span className="text-xs font-bold text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex justify-end">
                    <div className={`px-6 py-2 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] ${(req.status === 'Completed' || req.status === 'COMPLETED' || req.status === 'Arranged')
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                      : (req.status === 'Approved' || req.status === 'ASSIGNED')
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                        : (req.status === 'Rejected' || req.status === 'REJECTED')
                          ? 'bg-red-50 border-red-500 text-red-600'
                          : 'bg-amber-50 border-amber-500 text-amber-600'
                      }`}>
                      {req.status === 'COMPLETED' || req.status === 'Arranged' ? 'Arranged' : req.status === 'ASSIGNED' || req.status === 'Approved' ? 'Approved' : req.status === 'REJECTED' || req.status === 'Rejected' ? 'Rejected' : req.status}
                    </div>
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
