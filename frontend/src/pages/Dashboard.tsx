import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService, donationService, requirementsService, hospitalService } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../services/supabase';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [eligibleRequests, setEligibleRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Set up Real-time subscriptions to auto-refresh when requests change
    const requirementsSubscription = supabase
      .channel('blood_requirements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requirements' }, () => {
        loadData();
      })
      .subscribe();

    const hospitalSubscription = supabase
      .channel('hospital_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_requests' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      requirementsSubscription.unsubscribe();
      hospitalSubscription.unsubscribe();
    };
  }, [user]);

  const loadData = async () => {
    try {
      if (!user) {
        // Mock data for demo mode
        const mockProfile = {
          id: 'demo-id',
          username: user?.username || 'Demo Student',
          trustScore: 50,
          isAvailable: true,
          studentDetails: {
            name: user?.username || 'Demo Student',
            department: 'Computer Science',
            year_semester: '3rd Year / 6th Sem',
            bloodGroup: 'B+',
          }
        };
        setProfile(mockProfile);
        setDonations([
          { id: '1', date: new Date().toISOString(), status: 'SUCCESS', reason: 'Verified donation at City Hospital' }
        ]);

        // Mock eligible requests
        setEligibleRequests([
          { id: 'req-1', hospitalName: 'Sona Medical Center', bloodGroup: 'B+', quantity: 2, patientName: 'John Doe', treatmentType: 'Emergency' }
        ]);
        setLoading(false);
        return;
      }

      const [profileData, donationsData, allRequests] = await Promise.all([
        userService.getProfile(),
        donationService.getMyDonations(),
        requirementsService.getAll()
      ]);

      setProfile(profileData);
      setDonations(donationsData || []);

      // Filter requests by blood group and status
      const studentBloodGroup = profileData.studentDetails?.bloodGroup;
      if (studentBloodGroup) {
        const myResponses = await requirementsService.getMyResponses();
        const responseIds = new Set((myResponses || []).map((r: any) => r.requirement_id));

        const eligible = allRequests.filter((req: any) => {
          const matchesBlood = req.bloodGroup?.replace(/\s/g, '').toUpperCase() === studentBloodGroup?.replace(/\s/g, '').toUpperCase();
          // ONLY show requests that are Approved or ASSIGNED. 
          // If status is 'COMPLETED', 'Arranged', or 'REJECTED', they will naturally be excluded here.
          const isApproved = req.status === 'Approved' || req.status === 'ASSIGNED';
          const isPendingResponse = !responseIds.has(req.id);
          const isNotAlreadyInHosp = req._source === 'hospital_requests'
            ? !(req.assigned_donors || []).includes(profileData.id || user?.id)
            : true;

          return matchesBlood && isApproved && isPendingResponse && isNotAlreadyInHosp;
        });
        setEligibleRequests(eligible);
      }
    } catch (error) {
      console.error('Failed to load data, using fallback for demo:', error);
      setProfile({
        username: user?.username || 'Student',
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

  const handleAcceptRequest = async (req: any) => {
    if (!profile) return;
    setAcceptingId(req.id);
    try {
      if (req._source === 'hospital_requests') {
        await hospitalService.respondToRequest(req.id, profile.id || user?.id);
      } else {
        await requirementsService.submitResponse(req.id, profile.id || user?.id);
      }
      alert('Thank you for accepting the request! The hospital/admin will contact you.');
      // Remove from list
      setEligibleRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (error: any) {
      console.error('Failed to accept:', error);
      if (error.message?.includes('unique constraint')) {
        alert('You have already accepted this request.');
        setEligibleRequests(prev => prev.filter(r => r.id !== req.id));
      } else {
        alert('Failed to accept request: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      if (user) {
        await userService.updateAvailability(!profile.isAvailable);
      }
      setProfile({ ...profile, isAvailable: !profile.isAvailable });
    } catch (error) {
      console.error('Failed to update availability:', error);
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



  return (
    <div className="relative min-h-screen bg-slate-50 pb-12">

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
        {/* Banner Section */}
        <div className="w-full relative h-40 sm:h-48 md:h-64 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl border-2 md:border-4 border-white/50">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGZE4ZYpZQOSKPpdFaQq-s3q1DA7P6FlEDGYsC1HUkUplCNfbH2AhAK00"
            alt="Blood Donation Mission"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex items-end p-4 sm:p-6 md:p-8">
            <div>
              <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight">SONA BLOODLINE</h2>
              <p className="text-purple-300 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] md:text-xs mt-0.5 md:mt-1">Every drop creates hope</p>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-2xl md:rounded-[2rem] shadow-xl shadow-purple-200/20 border border-purple-100">
          <div className="flex items-center space-x-4 sm:x-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <span className="text-2xl sm:text-3xl font-black">{studentDetails.bloodGroup || '??'}</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">
                {profile.username || 'Student'}
              </h1>
              <p className="text-slate-500 font-bold mt-1 sm:mt-2 flex items-center text-xs sm:text-sm">
                <span className="hidden sm:inline-block bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase mr-2 border border-purple-100">Verified Donor</span>
                {studentDetails.department}
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
              className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${profile.isAvailable ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-200'
                }`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-500 shadow-md ${profile.isAvailable ? 'translate-x-10' : 'translate-x-1.5'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Main Grid: Student Info + Urgent Requests (Equal Space) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Student Information Card */}
          <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-purple-900/10 text-white flex flex-col justify-between relative overflow-hidden h-full">
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Scholarly Profile</h2>
            <div className="grid grid-cols-2 gap-8 relative z-10 flex-grow">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Department</p>
                <p className="text-xl font-black text-white leading-tight">{studentDetails.department || 'General'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Year / Sem</p>
                <p className="text-xl font-black text-white leading-tight">{studentDetails.year_semester || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Gifts Shared</p>
                <p className="text-4xl font-black text-emerald-400">
                  {donations.filter(d => d.status === 'SUCCESS').length}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Status</p>
                <p className="text-xl font-black text-amber-400 uppercase tracking-tighter">Ready to Donate</p>
              </div>
            </div>
          </div>

          {/* Urgent Requests / I Want to Donate Card */}
          <div className="h-full">
            {eligibleRequests.length > 0 && profile.isAvailable ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center space-x-3 px-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Requirements ({studentDetails.bloodGroup})</h2>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 max-h-[400px] scrollbar-hide">
                  {eligibleRequests.map((req: any) => (
                    <div key={req.id} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-200/20 border border-purple-100 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-2xl transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-800 leading-tight uppercase">{req.hospitalName}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{req.treatmentType}</p>
                        </div>
                        <div className="bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                          <span className="text-indigo-600 font-black text-xs">{req.bloodGroup}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 mt-2">
                        <div className="text-sm text-slate-500 font-medium flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient</span>
                          <span className="font-black text-slate-800 uppercase">{req.patientName || 'Emergency'}</span>
                        </div>
                        {req.purpose && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Purpose</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50/50 px-2 py-0.5 rounded-lg">
                              {req.purpose}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</span>
                          <span className="font-black text-slate-800">{req.quantity} Units</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={acceptingId === req.id}
                        className={`mt-6 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 ${acceptingId === req.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}
                      >
                        {acceptingId === req.id ? 'Accepting...' : 'I Want to Donate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl shadow-purple-200/20 border border-purple-100 h-full flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active {studentDetails.bloodGroup} requests</p>
                <p className="text-slate-300 text-[10px] mt-2 italic px-8">We'll notify you when someone nearby needs your gift.</p>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Score Display */}
        <div className="flex items-center justify-center py-6 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-purple-100 shadow-xl shadow-purple-200/10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
            SCHOLAR POWER POINTS <span className="text-3xl text-indigo-600 ml-4 font-black">{profile.trustScore}</span>
          </p>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-purple-200/20 border border-purple-100 overflow-hidden">
          <div className="p-8 border-b border-purple-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vault Records</h2>
            <span className="bg-indigo-50 text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">Live Logs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-purple-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outcome Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {donations.length > 0 ? donations.slice(0, 5).map((donation) => (
                  <tr key={donation.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-black text-slate-600 uppercase">
                      {formatDate(donation.date)}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${donation.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : donation.status === 'FAILURE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-400 italic">
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
    </div>

  );
};

export default Dashboard;
