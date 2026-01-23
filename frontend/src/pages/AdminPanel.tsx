import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersData = await userService.getAllUsers({ role: 'STUDENT' });
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Demo fallback data
      setUsers([
        {
          id: '1',
          studentDetails: {
            name: 'Arun Kumar',
            registrationNumber: '2021CS001',
            department: 'CSE',
            year_semester: '3rd Year / A',
            phoneNumber: '9876543210',
          },
          isAvailable: true,
          lastActive: new Date().toISOString(),
        },
        {
          id: '2',
          studentDetails: {
            name: 'Priya Sharma',
            registrationNumber: '2021IT045',
            department: 'IT',
            year_semester: '2nd Year / B',
            phoneNumber: '9123456789',
          },
          isAvailable: false,
          lastActive: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          studentDetails: {
            name: 'Rahul Verma',
            registrationNumber: '2022ECE012',
            department: 'ECE',
            year_semester: '1st Year / C',
            phoneNumber: '9988776655',
          },
          isAvailable: true,
          lastActive: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (userId: string, currentStatus: boolean) => {
    // Toggle locally for demo mode
    setUsers(users.map(u => u.id === userId ? { ...u, isAvailable: !currentStatus } : u));
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
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Admin Control Center</h1>
              <p className="text-slate-400 text-xs font-medium">Blood Donation Management System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/20 transition-all font-bold text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-800/50 backdrop-blur-md rounded-[2rem] border border-slate-700 overflow-hidden shadow-2xl">
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
                    <td className="px-6 py-5 text-sm font-bold text-slate-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-white">{user.studentDetails?.name || '-'}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">
                      {user.studentDetails?.registrationNumber || '-'}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">
                      {user.studentDetails?.department || '-'} / {user.studentDetails?.year_semester || '-'}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-400">
                      {user.studentDetails?.phoneNumber || '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                        {getTimeSinceActive(user.lastActive || user.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleAvailability(user.id, user.isAvailable)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${user.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                          }`}
                      >
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
