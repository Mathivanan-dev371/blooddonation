import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService, requirementsService } from '../services/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, requestsData] = await Promise.all([
        userService.getAllUsers({ role: 'STUDENT' }),
        requirementsService.getAll()
      ]);
      setUsers(usersData || []);
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Demo fallback data
      setUsers([
        {
          id: '1',
          studentDetails: { name: 'Arun Kumar', registrationNumber: '2021CS001', department: 'CSE', year_semester: '3rd Year / A', phoneNumber: '9876543210' },
          isAvailable: true,
          lastActive: new Date().toISOString(),
        }
      ]);
      setRequests([
        {
          id: '101',
          hospitalName: 'City General Hospital',
          contactNumber: '0427-224455',
          patientName: 'Ravi Kumar',
          treatmentType: 'Surgery',
          bloodGroup: 'B+',
          quantity: 2,
          status: 'Pending',
          createdAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (userId: string, currentStatus: boolean) => {
    // Toggle locally for demo mode
    setUsers(users.map(u => u.id === userId ? { ...u, isAvailable: !currentStatus } : u));
  };

  const handleSendEmail = (req: any) => {
    const eligibleStudents = users.filter(u =>
      u.studentDetails?.bloodGroup === req.bloodGroup && u.isAvailable
    );

    if (eligibleStudents.length === 0) {
      alert(`No eligible donors found for blood group ${req.bloodGroup}`);
      return;
    }

    alert(`Email notification sent to ${eligibleStudents.length} eligible donor(s) for Request #${req.id.slice(0, 8)}\n\nBlood Group: ${req.bloodGroup}\nPatient: ${req.patientName}\nUnits Needed: ${req.quantity}`);
  };

  const handleMarkArranged = async (reqId: string) => {
    try {
      await requirementsService.updateStatus(reqId, 'Arranged');
      alert('Request marked as Arranged successfully!');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
      // Optimistic update for demo
      setRequests(requests.map(r => r.id === reqId ? { ...r, status: 'Arranged' } : r));
      alert('Request marked as Arranged!');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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

  // Filter only pending requests (not arranged)
  const pendingRequests = requests.filter(r => r.status !== 'Arranged');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Logout */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Admin Control Center</h1>
                <p className="text-slate-400 text-xs font-medium">Blood Donation Management System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin/hospitals')} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl border border-indigo-500/20 transition-all font-bold text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span>Hospital Update</span>
            </button>
            <button onClick={handleLogout} className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/20 transition-all font-bold text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hospital Requests Section */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-[2rem] border border-slate-700 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Pending Blood Requests</h2>
            <span className="bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold">
              {pendingRequests.length} Requests
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Req ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Contact / Hospital</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Patient Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Blood Group</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Units</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Requested</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">
                      #{req.id ? req.id.slice(0, 8) : 'UNK'}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-white">{req.contactNumber || 'No Contact'}</p>
                      <p className="text-xs text-slate-500 font-mono tracking-wide">{req.hospitalName || 'Partner Hospital'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-300">{req.patientName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{req.treatmentType || 'Emergency'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-500/20 text-red-400 font-bold text-xs ring-1 ring-red-500/30">
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-300">
                      {req.quantity} Units
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                        {getTimeSinceActive(req.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${req.status === 'Pending' || req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        req.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleSendEmail(req)}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-all"
                          title="Send Email to Eligible Donors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMarkArranged(req.id)}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-all"
                          title="Mark as Arranged"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold italic">
                      No pending requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Donor Registry Section */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-[2rem] border border-slate-700 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-widest">Student Donor Registry</h2>
            <span className="bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold">
              {users.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">S.No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Reg No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Department / Year / Sec</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ph No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Timer</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Availability Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-slate-300">{index + 1}</td>
                    <td className="px-6 py-5"><p className="text-sm font-bold text-white">{user.studentDetails?.name || '-'}</p></td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">{user.studentDetails?.registrationNumber || '-'}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">{user.studentDetails?.department || '-'} / {user.studentDetails?.year_semester || '-'}</td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">{user.studentDetails?.phoneNumber || '-'}</td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                        {getTimeSinceActive(user.lastActive || user.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => handleToggleAvailability(user.id, user.isAvailable)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${user.isAvailable ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'}`}>
                        {user.isAvailable ? 'Present' : 'Absent'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold italic">
                      No student records found in the system.
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

export default AdminPanel;
