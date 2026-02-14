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
        const mockProfile = {
          id: 'demo-id',
          username: 'Demo Student',
          displayName: 'Demo Student',
          trustScore: 50,
          isAvailable: true,
          studentDetails: {
            name: 'Demo Student',
            department: 'Computer Science',
            collegeName: 'Sona College of Technology',
            bloodGroup: 'B+',
          }
        };
        setProfile(mockProfile);
        setDonations([
          { id: '1', date: new Date().toISOString(), status: 'SUCCESS', reason: 'Verified donation at City Hospital' }
        ]);
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
      console.log('Dashboard Profile Loaded:', profileData);
      setDonations(donationsData || []);

      const studentBloodGroup = profileData.studentDetails?.bloodGroup;
      if (studentBloodGroup) {
        const myResponses = await requirementsService.getMyResponses();
        const responseIds = new Set((myResponses || []).map((r: any) => r.requirement_id));

        const eligible = allRequests.filter((req: any) => {
          const matchesBlood = req.bloodGroup?.replace(/\s/g, '').toUpperCase() === studentBloodGroup?.replace(/\s/g, '').toUpperCase();
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
      console.error('Failed to load data:', error);
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
      setEligibleRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (error: any) {
      console.error('Failed to accept:', error);
      alert('Failed to accept request: ' + (error.message || 'Unknown error'));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!profile) return;
    setUpdating(true);
    try {
      await userService.updateAvailability(!profile.isAvailable);
      setProfile({ ...profile, isAvailable: !profile.isAvailable });
    } catch (error) {
      console.error('Failed to update availability:', error);
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
  const bannerImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGZE4ZYpZQOSKPpdFaQq-s3q1DA7P6FlEDGYsC1HUkUplCNfbH2AhAK00";

  return (
    <div className="relative min-h-screen bg-slate-50 pb-12">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
        {/* Banner Section */}
        <div className="w-full relative h-40 sm:h-48 md:h-64 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl border-2 md:border-4 border-white/50 bg-slate-200">
          <img
            src={bannerImage}
            alt="Blood Donation Mission"
            className="w-full h-full object-cover opacity-80"
          />

          {/* Dynamic Blood Group Overlay - Tight crop to hide 'A' while fitting the text size */}
          <div className="absolute left-[32.3%] top-[48.3%] transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="bg-[#fcfcfc] px-1 md:px-2 py-0.5 rounded-sm flex items-center justify-center">
              <span className="text-xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-none select-none">
                {studentDetails.bloodGroup || '??'}
              </span>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-4 sm:p-6 md:p-8">
            <div>
              <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight">SONA</h2>
              <p className="text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Official Donor Dashboard</p>
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
                {profile.displayName || profile.username || 'Student'}
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
              className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${profile.isAvailable ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-200'}`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-500 shadow-md ${profile.isAvailable ? 'translate-x-10' : 'translate-x-1.5'}`}
              />
            </button>
          </div>
        </div>

        {/* Status and Profile Stack - Centered and professional width */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Urgent Requests / Status Card - Priority Header */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-purple-200/20 border border-purple-100 flex flex-col overflow-hidden relative">
            {eligibleRequests.length > 0 && profile.isAvailable ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Alerts</h2>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                    {studentDetails.bloodGroup}
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {eligibleRequests.map((req: any) => (
                    <div key={req.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col group hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase">{req.hospitalName}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{req.treatmentType}</p>
                        </div>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-black text-[10px]">{req.bloodGroup}</span>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={acceptingId === req.id}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                      >
                        {acceptingId === req.id ? 'Securing...' : 'Accept MISSION'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2-2 0 00-2-2H6a2-2 0 00-2 2v7m16 0a2-2 0 01-2 2H6a2-2 0 01-2-2m16 0V9a2-2 0 00-2-2H6a2-2 0 00-2 2v4m16 0l-8 8-8-8" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase">Status: On Standby</h3>
                  <p className="text-slate-400 font-bold text-[10px] italic">
                    {profile.isAvailable
                      ? `Scanning for ${studentDetails.bloodGroup} requirements...`
                      : "Availability is currently disabled."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Donor Profile Information Card - Supporting Details */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-purple-900/10 text-white relative overflow-hidden">
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Profile Record</h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 relative z-10">
              <div className="border-l-2 border-indigo-500/30 pl-4">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Department</p>
                <p className="text-sm font-black text-white uppercase">{studentDetails.department || 'N/A'}</p>
              </div>
              <div className="border-l-2 border-indigo-500/30 pl-4">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Institution</p>
                <p className="text-sm font-black text-white uppercase truncate">{studentDetails.collegeName || 'SCTC'}</p>
              </div>
              <div className="border-l-2 border-emerald-500/30 pl-4">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Donations</p>
                <p className="text-2xl font-black text-emerald-400">
                  {donations.filter(d => d.status === 'SUCCESS').length}
                </p>
              </div>
              <div className="border-l-2 border-amber-500/30 pl-4">
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Status</p>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Verified Donor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Contributions Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-200/20 border border-purple-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-purple-50 flex items-center justify-between bg-purple-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contribution Vault</h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Live Log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-purple-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
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
                      No contribution records found.
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
