import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService, requirementsService, hospitalService, notificationService } from '../services/api';
import { supabase } from '../services/supabase';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'registry'>('requests');
  const [sortOrder, setSortOrder] = useState<'none' | 'highest' | 'lowest'>('none');
  const [searchQuery, setSearchQuery] = useState('');

  // Hospital Registry States
  const [registeredHospitals, setRegisteredHospitals] = useState<any[]>([]);
  const [registryForm, setRegistryForm] = useState({
    hospitalName: '',
    email: '',
    password: '',
    location: ''
  });
  const [processingRegistry, setProcessingRegistry] = useState(false);
  const [sendingNotify, setSendingNotify] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadRegistry();

    // Set up Real-time subscriptions for Admin Panel
    const requirementsSubscription = supabase
      .channel('admin_requirements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requirements' }, () => {
        loadData();
      })
      .subscribe();

    const hospitalSubscription = supabase
      .channel('admin_hospital_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_requests' }, () => {
        loadData();
      })
      .subscribe();

    const profilesSubscription = supabase
      .channel('admin_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      requirementsSubscription.unsubscribe();
      hospitalSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, []);

  const loadRegistry = async () => {
    try {
      const data = await hospitalService.getAllRegisteredByAdmin();
      setRegisteredHospitals(data || []);
    } catch (err) {
      console.error('Failed to load registry:', err);
    }
  };

  const loadData = async () => {
    try {
      const [usersData, allRequests] = await Promise.all([
        userService.getAllUsers({ role: 'STUDENT' }),
        requirementsService.getAll()
      ]);
      setUsers(usersData || []);
      setRequests((allRequests || []).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registryForm.hospitalName || !registryForm.email || !registryForm.password) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessingRegistry(true);
    try {
      await hospitalService.registerByAdmin(registryForm);
      alert('Hospital registered successfully! They can now login with these credentials.');
      setRegistryForm({ hospitalName: '', email: '', password: '', location: '' });
      loadRegistry();
    } catch (err: any) {
      alert('Failed to register hospital: ' + err.message);
    } finally {
      setProcessingRegistry(false);
    }
  };


  const handleNotify = async (req: any) => {
    // If request is already approved, send notification
    if (req.status === 'Approved' || req.status === 'ASSIGNED') {
      if (req.notificationSent) {
        const confirmResend = window.confirm('Notifications have already been sent for this request. Do you want to send them again?');
        if (!confirmResend) return;
      }
      setSendingNotify(req.id);
      try {
        const result = await notificationService.sendRequestNotification(req);
        alert(`Notifications sent to ${result?.count || 0} matching donors!`);
        loadData();
      } catch (error) {
        console.error('Failed to send notifications:', error);
        alert('Failed to send notifications. Checks console for details.');
      } finally {
        setSendingNotify(null);
      }
      return;
    }

    // Approval Logic
    const eligibleStudents = users.filter(u =>
      u.studentDetails?.bloodGroup?.replace(/\s/g, '').toUpperCase() === req.bloodGroup?.replace(/\s/g, '').toUpperCase() && u.isAvailable
    );

    if (eligibleStudents.length === 0) {
      const confirmApprove = window.confirm(`No currently available donors found for blood group ${req.bloodGroup}. Do you want to approve it anyway to make it visible to students?`);
      if (!confirmApprove) return;
    }

    try {
      if (req._source === 'hospital_requests') {
        await hospitalService.updateStatus(req.id, 'Approved');
      } else {
        await requirementsService.updateStatus(req.id, 'Approved');
      }
      alert(`Request Approved! You can now click "Notify" to send FCM notifications.`);
      loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request.');
    }
  };

  const handleViewResponses = (req: any) => {
    navigate(`/admin/responses?id=${req.id}&source=${req._source}`, { replace: true });
  };

  const handleMarkArranged = async (req: any) => {
    try {
      if (req._source === 'hospital_requests') {
        await hospitalService.updateStatus(req.id, 'Arranged');
      } else {
        await requirementsService.updateStatus(req.id, 'Arranged');
      }
      alert('Request marked as Arranged!');
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update database.');
    }
  };

  const handleRejectRequest = async (req: any) => {
    const confirmed = window.confirm('Are you sure you want to reject this request?');
    if (!confirmed) return;

    try {
      if (req._source === 'hospital_requests') {
        await hospitalService.updateStatus(req.id, 'Rejected');
      } else {
        await requirementsService.updateStatus(req.id, 'Rejected');
      }
      alert('Request rejected.');
      loadData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(`DANGER: Are you sure you want to PERMANENTLY delete the account for ${userName}? This action cannot be undone and they will lose all access.`);
    if (!confirmed) return;

    try {
      // Optimistically update UI
      setUsers(prev => prev.filter(u => u.id !== userId));

      await userService.deleteUser(userId);
      alert(`${userName}'s account has been successfully deleted.`);
      loadData(); // Final sync
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
      loadData(); // Revert if failed
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const getTimeSinceActive = (lastActive: string) => {
    if (!lastActive) return 'Just now';
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const pendingRequests = requests.filter(r =>
    r.status !== 'Arranged' &&
    r.status !== 'COMPLETED' &&
    r.status !== 'CANCELLED' &&
    r.status !== 'Rejected' &&
    r.status !== 'REJECTED'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Floating Back Button - To match Login portals */}
      <button
        onClick={() => navigate('/', { replace: true })}
        className="fixed top-6 right-6 z-[100] flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Back</span>
      </button>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-purple-100 sticky top-0 z-50 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <div className="block ml-28 sm:ml-36 md:ml-44">
                <h1 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight">Admin Control</h1>
                <p className="text-purple-400 text-[10px] font-bold tracking-widest mt-0.5">SONA BLOODLINE</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 relative">
              <nav className="flex p-1 bg-purple-50/50 rounded-2xl border border-purple-100">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  Requests
                </button>
                <button
                  onClick={() => setActiveTab('registry')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  Registry
                </button>
                <button
                  onClick={() => navigate('/admin/history', { replace: true })}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all"
                >
                  History
                </button>
              </nav>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-all font-black text-[10px] uppercase tracking-wider"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        {activeTab === 'requests' ? (
          <div className="space-y-12">
            {/* Live Requirements */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                  Live Requirements
                </h2>
                <span className="px-3 py-1 bg-white border border-purple-100 rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm">
                  {pendingRequests.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-[2.5rem] p-6 border border-purple-100 shadow-xl shadow-purple-200/20 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-2xl transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col max-w-[70%]">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">#{req.id.slice(0, 6)}</span>
                          <h3 className="text-lg font-black text-slate-800 leading-tight uppercase line-clamp-1">{req.hospitalName}</h3>
                          <p className="text-xs text-slate-400 font-bold mt-1 uppercase">{req.contactNumber}</p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-purple-600 font-black text-lg">{req.bloodGroup}</span>
                          <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter mt-1">Group</span>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-xs border-b border-purple-50 pb-3">
                          <span className="text-slate-400 font-bold uppercase">Patient</span>
                          <span className="text-slate-700 font-black">
                            {req.patientName || 'Emergency'}
                            {req.patientAge ? ` (${req.patientAge}y)` : ''}
                          </span>
                        </div>
                        {req.purpose && (
                          <div className="flex items-center justify-between text-xs border-b border-purple-50 pb-3">
                            <span className="text-slate-400 font-bold uppercase">Purpose</span>
                            <span className="text-indigo-600 font-black uppercase tracking-tight">{req.purpose}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs border-b border-purple-50 pb-3">
                          <span className="text-slate-400 font-bold uppercase">Amount</span>
                          <div className="text-right">
                            <p className="text-slate-700 font-black">{req.quantity} Units</p>
                            <p className="text-[10px] text-amber-600 font-bold mt-0.5">{getTimeSinceActive(req.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {req.status === 'ASSIGNED' ? 'Approved' : req.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button
                        onClick={() => handleNotify(req)}
                        disabled={sendingNotify === req.id}
                        className={`flex items-center justify-center py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${req.notificationSent
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                            : (req.status === 'Approved' || req.status === 'ASSIGNED')
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          } ${sendingNotify === req.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {sendingNotify === req.id
                          ? 'Sending...'
                          : req.notificationSent
                            ? 'Notified ✓'
                            : (req.status === 'Approved' || req.status === 'ASSIGNED')
                              ? 'Notify'
                              : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleViewResponses(req)}
                        className="flex items-center justify-center py-3 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-fuchsia-100 transition-all"
                      >
                        Scholars
                      </button>
                      <button
                        onClick={() => handleMarkArranged(req)}
                        className="flex items-center justify-center py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-1 hover:bg-emerald-100 transition-all"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        className="flex items-center justify-center py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-1 hover:bg-rose-100 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Donor Registry */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Donor Registry</h2>
                  <span className="px-3 py-1 bg-white border border-purple-100 rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm">
                    {users.length} Registered
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search Name / Reg No..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-purple-100 rounded-xl px-10 py-2.5 text-[10px] font-black uppercase text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono shadow-sm"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort By:</span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="bg-white border border-purple-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm"
                    >
                      <option value="none">Default</option>
                      <option value="highest">Highest Score</option>
                      <option value="lowest">Lowest Score</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block bg-white rounded-[2.5rem] border border-purple-100 overflow-hidden shadow-xl shadow-purple-200/10">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-purple-50/50 border-b border-purple-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credit Score</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone No</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {[...users]
                      .filter(u => {
                        const q = searchQuery.toLowerCase();
                        return (
                          u.studentDetails?.name?.toLowerCase().includes(q) ||
                          u.studentDetails?.admissionNumber?.toLowerCase().includes(q) ||
                          u.studentDetails?.phoneNumber?.includes(q)
                        );
                      })
                      .sort((a, b) => {
                        if (sortOrder === 'highest') return b.trustScore - a.trustScore;
                        if (sortOrder === 'lowest') return a.trustScore - b.trustScore;
                        return 0;
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-black text-slate-800 uppercase text-sm">{u.studentDetails?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-tight italic">ID: {u.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2 py-1 bg-red-50 text-red-500 rounded-lg font-black text-xs ring-1 ring-red-100">{u.studentDetails?.bloodGroup}</span>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-600 uppercase">{u.studentDetails?.year || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-600 uppercase leading-none">{u.studentDetails?.department}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">{u.studentDetails?.admissionNumber}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${u.trustScore >= 70 ? 'bg-emerald-50 text-emerald-600' :
                              u.trustScore >= 40 ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-500'
                              }`}>
                              {u.trustScore} pts
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-indigo-600">{u.studentDetails?.phoneNumber}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.studentDetails?.name || u.username)}
                              className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all rounded-lg"
                              title="Delete Account"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Registry Grid */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...users]
                  .filter(u => {
                    const q = searchQuery.toLowerCase();
                    return (
                      u.studentDetails?.name?.toLowerCase().includes(q) ||
                      u.studentDetails?.admissionNumber?.toLowerCase().includes(q) ||
                      u.studentDetails?.phoneNumber?.includes(q)
                    );
                  })
                  .sort((a, b) => {
                    if (sortOrder === 'highest') return b.trustScore - a.trustScore;
                    if (sortOrder === 'lowest') return a.trustScore - b.trustScore;
                    return 0;
                  })
                  .map((u) => (
                    <div key={u.id} className="bg-slate-800/80 p-6 rounded-[2rem] border border-slate-700 shadow-lg relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-16 h-16 flex items-center justify-center -mr-6 -mt-6 rotate-45 ${u.trustScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                        u.trustScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                        <span className="text-[10px] font-black -rotate-45 mt-4">{u.trustScore}</span>
                      </div>

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-base font-black text-white uppercase leading-none">{u.studentDetails?.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">{u.studentDetails?.admissionNumber}</p>
                        </div>
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-black ring-1 ring-red-500/20">{u.studentDetails?.bloodGroup}</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">Department</span>
                          <span className="text-slate-300 text-right">{u.studentDetails?.department}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">Year</span>
                          <span className="text-slate-300 text-right">{u.studentDetails?.year || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">Credit Score</span>
                          <span className={`px-2 py-0.5 rounded ${u.trustScore >= 70 ? 'text-emerald-400 bg-emerald-500/10' :
                            u.trustScore >= 40 ? 'text-amber-400 bg-amber-500/10' :
                              'text-rose-400 bg-rose-500/10'
                            }`}>{u.trustScore} PTS</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pt-3 border-t border-slate-700/50">
                          <span className="text-slate-500">Contact</span>
                          <span className="text-indigo-400">{u.studentDetails?.phoneNumber}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-700/50 flex justify-end">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.studentDetails?.name || u.username)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete Scholar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Registration Form */}
            <div className="bg-white p-10 rounded-[3rem] border border-purple-100 shadow-xl shadow-purple-200/10 h-fit">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Register Hospital</h2>
              <form onSubmit={handleRegisterHospital} className="space-y-6">
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm shadow-sm"
                  placeholder="Hospital Name"
                  value={registryForm.hospitalName}
                  onChange={(e) => setRegistryForm({ ...registryForm, hospitalName: e.target.value })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm shadow-sm"
                  placeholder="Location"
                  value={registryForm.location}
                  onChange={(e) => setRegistryForm({ ...registryForm, location: e.target.value })}
                />
                <input
                  type="email"
                  required
                  className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm shadow-sm"
                  placeholder="Login Email"
                  value={registryForm.email}
                  onChange={(e) => setRegistryForm({ ...registryForm, email: e.target.value })}
                />
                <input
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-purple-50/30 border border-purple-100 rounded-2xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm tracking-widest shadow-sm"
                  placeholder="Create Password"
                  value={registryForm.password}
                  onChange={(e) => setRegistryForm({ ...registryForm, password: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={processingRegistry}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all h-16"
                >
                  {processingRegistry ? 'Processing...' : 'Add to Network'}
                </button>
              </form>
            </div>

            {/* Registry List */}
            <div className="space-y-6">
              <h2 className="text-sm font-black text-slate-400 uppercase px-2 tracking-widest">Registered Network</h2>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {registeredHospitals.map((h) => (
                  <div key={h.id} className="bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-slate-800 font-black uppercase text-base">{h.hospital_name}</h4>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1 tracking-tight">{h.location}</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-tighter">Active</span>
                    </div>
                    <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100/50">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Access Info</p>
                      <p className="text-xs font-bold text-indigo-900">{h.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
