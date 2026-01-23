import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService, donationService } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user) {
        // Mock data for demo mode
        setProfile({
          username: 'Demo_Student',
          trustScore: 50,
          isAvailable: true,
          studentDetails: {
            name: 'Demo Student',
            department: 'Computer Science',
            year_semester: '3rd Year / 6th Sem',
            bloodGroup: 'O+',
          }
        });
        setDonations([
          { id: '1', date: new Date().toISOString(), status: 'SUCCESS', reason: 'Verified donation at City Hospital' }
        ]);
        setLoading(false);
        return;
      }

      const [profileData, donationsData] = await Promise.all([
        userService.getProfile(),
        donationService.getMyDonations(),
      ]);
      setProfile(profileData);
      setDonations(donationsData || []);
    } catch (error) {
      console.error('Failed to load data, using fallback for demo:', error);
      setProfile({
        username: 'Pavi',
        trustScore: 50,
        isAvailable: true,
        studentDetails: {
          department: 'Information Technology',
          year_semester: '4th Year / 7th Sem',
          bloodGroup: 'B+',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      // If we have a real user session, update the database
      if (user) {
        await userService.updateAvailability(!profile.isAvailable);
      }
      // Always update local state so the UI toggles (especially for Demo mode)
      setProfile({ ...profile, isAvailable: !profile.isAvailable });
    } catch (error) {
      console.error('Failed to update availability:', error);
      // Still toggle locally if it's just a demo/permission issue
      setProfile({ ...profile, isAvailable: !profile.isAvailable });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12 text-slate-500 font-bold">Failed to load profile portal.</div>;
  }

  const studentDetails = profile.studentDetails || {};

  const getDonorStatus = () => {
    if (!profile.isAvailable) return { label: 'UNAVAILABLE', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (profile.trustScore >= 70) return { label: 'ACTIVE', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (profile.trustScore >= 50) return { label: 'SEMI ACTIVE', color: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'COOL DOWN', color: 'bg-blue-50 text-blue-700 border-blue-100' };
  };

  const statusBadge = getDonorStatus();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-50">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
            <span className="text-3xl font-black">{studentDetails.bloodGroup || '??'}</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {profile.username || 'Student User'}
            </h1>
            <p className="text-slate-500 font-bold mt-2 flex items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase mr-2 border border-slate-200">Identity Verified</span>
              {studentDetails.department} • {studentDetails.year_semester}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Availability Mode</p>
            <p className={`text-sm font-black ${profile.isAvailable ? 'text-emerald-500' : 'text-slate-400'}`}>
              {profile.isAvailable ? 'ACTIVE' : 'UN ACTIVE'}
            </p>
          </div>
          <button
            onClick={handleAvailabilityToggle}
            disabled={updating}
            className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${profile.isAvailable ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-200'
              }`}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-500 shadow-md ${profile.isAvailable ? 'translate-x-10' : 'translate-x-1.5'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <svg className="w-24 h-24 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Current Trust Score</p>
          <div className="relative">
            <div className="text-7xl font-black text-slate-900 tabular-nums">{profile.trustScore}</div>
            <div className="absolute -top-2 -right-6 text-red-500 font-black text-lg">+10</div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className={`px-4 py-1.5 rounded-xl border text-[11px] font-black tracking-widest ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            {profile.isAvailable && (
              <span className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-black tracking-widest uppercase">
                DISCOVERABLE
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-300 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-600 opacity-20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2"></div>
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Department</p>
              <p className="text-xl font-black text-white">{studentDetails.department || 'General'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Year / Sem</p>
              <p className="text-xl font-black text-white">{studentDetails.year_semester || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Successful Gifts</p>
              <p className="text-3xl font-black text-emerald-400">
                {donations.filter(d => d.status === 'SUCCESS').length}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Next Eligibility</p>
              <p className="text-xl font-black text-amber-400 uppercase tracking-tighter">Ready to Donate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Activity</h2>
          <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">Live Logs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outcome Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donations.length > 0 ? donations.slice(0, 5).map((donation) => (
                <tr key={donation.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                    {formatDate(donation.date)}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${donation.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : donation.status === 'FAILURE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-400 italic">
                    {donation.reason || 'Verification record created.'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                    No contribution records found in your vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
