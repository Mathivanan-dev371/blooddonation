import { supabase } from './supabase';

// Helper to standardise errors
const handleError = (error: any) => {
  const message = error.message || 'An error occurred';
  const err = new Error(message);
  // Attach the old structure for any code still expecting it
  (err as any).response = {
    data: {
      error: message,
    },
  };
  throw err;
};

const mapStudentDetails = (details: any) => {
  if (!details) return null;
  // Handle case where it might be an array
  const d = Array.isArray(details) ? details[0] : details;
  if (!d) return null;

  return {
    ...d,
    admissionNumber: d.admission_number,
    phoneNumber: d.phone_number,
    bloodGroup: d.blood_group,
    collegeName: d.college_name,
    //year_semester is already used as year_semester in dashboard
  };
};

const mapProfile = (profile: any) => {
  if (!profile) return null;
  const studentDetails = mapStudentDetails(profile.student_details);

  // Choose the best name for display (priority: student name > hospital name > username)
  const displayName = studentDetails?.name || profile.hospital_name || profile.username;

  return {
    ...profile,
    displayName,
    trustScore: profile.trust_score ?? 50,
    isAvailable: profile.is_available ?? false,
    isActive: profile.is_active ?? true,
    studentDetails,
  };
};

export const authService = {
  setToken: (_token: string | null) => {
    // Supabase handles session automatically, but we can set it if needed manually
    // or just ignore if we trust the persistent session.
  },
  login: async (usernameOrEmail: string, password: string) => {
    const identifier = usernameOrEmail.trim();
    let email = identifier;

    if (!identifier.includes('@')) {
      try {
        const { data: studentMatch, error: studentError } = await supabase
          .from('student_details')
          .select('user_id')
          .ilike('admission_number', identifier)
          .maybeSingle();

        if (studentMatch && !studentError) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', studentMatch.user_id)
            .maybeSingle();

          if (profile?.email) {
            email = profile.email;
          }
        } else {
          const { data: profile, error: profileLookupError } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', identifier)
            .maybeSingle();

          if (profile && profile.email && !profileLookupError) {
            email = profile.email;
          }
        }
      } catch (e) {
        console.error('Identifier resolution error:', e);
      }
    }

    if (!identifier.includes('@') && email === identifier) {
      throw new Error('No account found with this Admission Number or Username.');
    }

    console.log(`Login Attempt: Identifier="${identifier}", ResolvedEmail="${email}"`);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase Login Error:', authError);
      if (authError.message.includes('Email not confirmed')) {
        throw new Error('Identity verification pending. Please confirm your email address or contact the administrator to disable email confirmation.');
      }

      const { data: manualAcc, error: manualError } = await supabase
        .from('hospital_accounts')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (manualAcc && !manualError) {
        return {
          user: {
            id: manualAcc.id,
            email: manualAcc.email,
            username: manualAcc.hospital_name,
            role: 'HOSPITAL',
            hospital_name: manualAcc.hospital_name,
            location: manualAcc.location,
            trustScore: 100,
            isActive: true
          },
          token: 'manual-hospital-token-' + manualAcc.id
        };
      }
      handleError(authError);
    }

    if (!authData.user) throw new Error('Login failed: No user data returned');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) console.error('Error fetching profile during login:', profileError);

    if (!profile) {
      throw new Error('Your account is no longer active. Please contact administration for support.');
    }

    const mappedProfile = mapProfile(profile);
    return {
      user: { ...authData.user, ...mappedProfile },
      token: authData.session?.access_token || 'supabase-token',
    };
  },
  register: async (registrationData: any) => {
    const { email, password, username, ...details } = registrationData;

    // 1. SignUp with ALL donor data in metadata so trigger can handle it
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role: 'STUDENT',
          name: details.name || username,
          admission_number: details.admissionNumber,
          phone_number: details.phoneNumber,
          blood_group: details.bloodGroup,
          department: details.department,
          college_name: details.collegeName,
        },
      },
    });

    if (authError) {
      if (!authError.message.includes('Error sending confirmation email')) {
        handleError(authError);
      }
    }
    if (!authData.user) throw new Error('Registration failed: No user returned');

    // Fetch full profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile during registration:', profileError);
    }

    if (!profile) {
      console.warn('Profile not yet available after registration. Trigger might still be running.');
      return {
        user: { ...authData.user, role: 'STUDENT' },
        token: authData.session?.access_token,
      };
    }

    const mappedProfile = mapProfile(profile);

    return {
      user: { ...authData.user, ...mappedProfile },
      token: authData.session?.access_token,
    };
  },
};

export const userService = {
  getProfile: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error in getProfile:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user) {
      console.warn('No session user found in getProfile');
      throw new Error('No user found');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching profile:', error);
      handleError(error);
    }

    if (!data) {
      console.error('Profile not found for user ID:', user.id);
      throw new Error('Profile not found. Please try logging out and in again, or contact support.');
    }

    return mapProfile(data);
  },
  updateAvailability: async (isAvailable: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_available: isAvailable })
      .eq('id', user.id)
      .select('*, student_details(*)')
      .single();

    if (error) handleError(error);
    return mapProfile(data);
  },
  updateProfile: async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Split data between profiles and student_details if needed
    // For now assuming profile updates imply student details updates mostly
    // or we check keys. The previous API merged them.
    // Let's assume we are updating student_details for most fields

    const detailsUpdates: any = {};
    if (data.phoneNumber) detailsUpdates.phone_number = data.phoneNumber;
    // ... map other fields if necessary

    if (Object.keys(detailsUpdates).length > 0) {
      const { error } = await supabase
        .from('student_details')
        .update(detailsUpdates)
        .eq('user_id', user.id);
      if (error) handleError(error);
    }

    // Return updated profile
    return userService.getProfile();
  },
  getDonors: async (filters?: any) => {
    let selectString = '*, student_details(*)';
    if (filters?.bloodGroup) {
      selectString = '*, student_details!inner(*)';
    }

    let query = supabase.from('profiles').select(selectString).eq('role', 'STUDENT');

    if (filters?.bloodGroup) {
      query = query.eq('student_details.blood_group', filters.bloodGroup);
    }
    // Optional: filter by availability if needed
    if (filters?.available === 'true') {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query;
    if (error) handleError(error);
    return (data || []).map(mapProfile);
  },
  getAllUsers: async (filters?: any) => {
    let query = supabase.from('profiles').select('*, student_details(*)');
    if (filters?.role) query = query.eq('role', filters.role);
    const { data, error } = await query;
    if (error) handleError(error);
    return (data || []).map(mapProfile);
  },
  getUserById: async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return mapProfile(data);
  },
  updateTrustScore: async (id: string, trustScore: number) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ trust_score: trustScore })
      .eq('id', id)
      .select('*, student_details(*)')
      .single();
    if (error) handleError(error);
    return mapProfile(data);
  },
  adjustTrustScore: async (userId: string, delta: number) => {
    const { error } = await supabase.rpc('adjust_trust_score', {
      p_user_id: userId,
      p_delta: delta
    });
    if (error) handleError(error);
    return true;
  },
  updateUserStatus: async (id: string, isActive: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('*, student_details(*)')
      .single();
    if (error) handleError(error);
    return mapProfile(data);
  },
  deleteUser: async (id: string) => {
    // We use a custom RPC because standard users cannot delete from auth.users via client
    // The delete_user_entirely function is defined to handle cascading deletes.
    const { error } = await supabase.rpc('delete_user_entirely', { p_user_id: id });

    // Fallback: if RPC isn't set up yet, at least delete the profile to revoke access
    if (error && error.message?.includes('function public.delete_user_entirely')) {
      console.warn('RPC delete_user_entirely not found, falling back to profile deletion');
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
      if (profileError) handleError(profileError);
    } else if (error) {
      handleError(error);
    }

    return { success: true };
  },
};

export const donationService = {
  getMyDonations: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('donation_attempts')
      .select('*')
      .eq('user_id', user.id);
    if (error) handleError(error);
    return data;
  },
  getAllDonations: async (filters?: any) => {
    let query = supabase.from('donation_attempts').select('*, user:profiles(*, student_details(*))');
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) handleError(error);
    return data;
  },
  updateDonationStatus: async (id: string, status: string, reason?: string) => {
    const { data, error } = await supabase
      .from('donation_attempts')
      .update({ status, reason })
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },
  getStats: async () => {
    // This is hard to do with simple client queries efficiently.
    // best to do multiple count queries or RPC
    const { count: total } = await supabase.from('donation_attempts').select('*', { count: 'exact', head: true });
    const { count: success } = await supabase.from('donation_attempts').select('*', { count: 'exact', head: true }).eq('status', 'SUCCESS');
    const { count: pending } = await supabase.from('donation_attempts').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');

    return { total, success, pending };
  },
};

export const hospitalService = {
  createRequest: async (data: { bloodGroup: string, quantity: number, hospitalName: string, hospitalAddress: string, arrivalTime: string, patientName?: string, phoneNumber?: string, patientAge?: number, purpose?: string }, hospitalId?: string) => {
    let userId = hospitalId;

    // If no hospitalId provided, try to get from Supabase auth (for real logged-in users)
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      throw new Error('Hospital ID not available. Please log in again.');
    }

    const { data: result, error } = await supabase
      .from('hospital_requests')
      .insert({
        hospital_id: userId,
        blood_group: data.bloodGroup,
        quantity: data.quantity,
        hospital_name: data.hospitalName,
        hospital_address: data.hospitalAddress,
        arrival_time: data.arrivalTime,
        patient_name: data.patientName,
        phone_number: data.phoneNumber,
        patient_age: data.patientAge,
        purpose: data.purpose
      })
      .select()
      .single();
    if (error) handleError(error);
    return result;
  },
  mapHospitalRequest: (req: any) => {
    if (!req) return null;
    return {
      ...req,
      _source: 'hospital_requests',
      bloodGroup: req.blood_group,
      hospitalName: req.hospital_name,
      hospitalAddress: req.hospital_address,
      arrivalTime: req.arrival_time,
      patientName: req.patient_name,
      patientAge: req.patient_age,
      purpose: req.purpose,
      contactNumber: req.phone_number,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    };
  },
  updateStatus: async (id: string, status: string) => {
    let dbStatus = status;
    if (status === 'Approved') dbStatus = 'ASSIGNED';
    if (status === 'Arranged') dbStatus = 'COMPLETED';
    if (status === 'Rejected') dbStatus = 'REJECTED';

    const { data, error } = await supabase
      .from('hospital_requests')
      .update({ status: dbStatus })
      .eq('id', id);
    if (error) handleError(error);
    return data;
  },
  getMyRequests: async (userId?: string) => {
    let hospitalId = userId;

    // If no userId provided, try to get from Supabase auth (for real logged-in users)
    if (!hospitalId) {
      const { data: { user } } = await supabase.auth.getUser();
      hospitalId = user?.id;
    }

    // If still no ID, return empty array
    if (!hospitalId) {
      console.warn('[getMyRequests] No hospital ID available');
      return [];
    }

    const { data, error } = await supabase
      .from('hospital_requests')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });
    if (error) handleError(error);
    return (data || []).map((req: any) => hospitalService.mapHospitalRequest(req));
  },
  respondToRequest: async (requestId: string, studentId: string) => {
    const { data: request, error: getError } = await supabase
      .from('hospital_requests')
      .select('assigned_donors')
      .eq('id', requestId)
      .single();

    if (getError || !request) {
      handleError(getError || new Error('Request not found'));
      return;
    }

    const { error } = await supabase.rpc('join_hospital_request', {
      p_request_id: requestId,
      p_student_id: studentId
    });

    if (error) handleError(error);
    return { success: true };
  },
  getEligibleDonors: async (requestId: string) => {
    // Fetch request to get blood group
    const { data: req } = await supabase.from('hospital_requests').select('blood_group').eq('id', requestId).single();
    if (!req) throw new Error('Request not found');

    // Fetch donors with that blood group
    const { data, error } = await supabase
      .from('student_details')
      .select('*, user:profiles!inner(*)')
      .eq('blood_group', req.blood_group)
      .eq('user.is_available', true);

    if (error) handleError(error);
    return data;
  },
  assignDonors: async (requestId: string, donorIds: string[]) => {
    const { data, error } = await supabase
      .from('hospital_requests')
      .update({ assigned_donors: donorIds, status: 'ASSIGNED' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) handleError(error);
    return data;
  },
  updateRequestStatus: async (requestId: string, status: string) => {
    const { data, error } = await supabase
      .from('hospital_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },
  getAllRequests: async () => {
    const { data, error } = await supabase.from('hospital_requests').select('*').order('created_at', { ascending: false });
    if (error) handleError(error);
    return (data || []).map((req: any) => hospitalService.mapHospitalRequest(req));
  },
  getRequestResponders: async (requestId: string) => {
    // 1. First try to get from the new tracking table
    const { data: tracking, error: trackError } = await supabase
      .from('hospital_response_tracking')
      .select('*, student:profiles(*, student_details(*))')
      .eq('request_id', requestId);

    if (!trackError && tracking && tracking.length > 0) {
      return tracking.map(item => ({
        ...item,
        student: mapProfile(item.student),
        status: 'Accepted'
      }));
    }

    // 2. Fallback to assigned_donors array for backward compatibility
    const { data: request, error: reqError } = await supabase
      .from('hospital_requests')
      .select('assigned_donors')
      .eq('id', requestId)
      .single();

    if (reqError) handleError(reqError);

    const donorIds = request?.assigned_donors || [];
    if (donorIds.length === 0) return [];

    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .in('id', donorIds);

    if (profError) handleError(profError);

    return (profiles || []).map(mapProfile).map(student => ({
      id: `resp-${student.id}`,
      student: student,
      status: 'Accepted',
      arrival_status: 'Pending'
    }));
  },
  updateArrivalStatus: async (requestId: string, studentId: string, status: string) => {
    // Try update first
    const { data, error } = await supabase
      .from('hospital_response_tracking')
      .update({ arrival_status: status })
      .eq('request_id', requestId)
      .eq('student_id', studentId)
      .select();

    if (!error && data && data.length > 0) return data[0];

    // Upsert if not exists
    const { data: upsertData, error: upsertError } = await supabase
      .from('hospital_response_tracking')
      .upsert({
        request_id: requestId,
        student_id: studentId,
        arrival_status: status
      }, { onConflict: 'request_id,student_id' })
      .select()
      .single();

    if (upsertError) handleError(upsertError);
    return upsertData;
  },
  registerByAdmin: async (data: { hospitalName: string, email: string, password: string, location: string }) => {
    const { data: result, error } = await supabase
      .from('hospital_accounts')
      .insert({
        hospital_name: data.hospitalName,
        email: data.email,
        password: data.password,
        location: data.location
      })
      .select()
      .single();
    if (error) handleError(error);
    return result;
  },
  getAllRegisteredByAdmin: async () => {
    const { data, error } = await supabase
      .from('hospital_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) handleError(error);
    return data || [];
  },
  deleteRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('hospital_requests')
      .delete()
      .eq('id', requestId);
    if (error) handleError(error);
    return true;
  }
};

export const requirementsService = {
  create: async (data: { hospitalName: string, bloodGroup: string, quantity: number, contactNumber?: string, patientName: string, treatmentType: string }) => {
    const { data: result, error } = await supabase
      .from('blood_requirements')
      .insert({
        hospital_name: data.hospitalName,
        contact_number: data.contactNumber,
        patient_name: data.patientName,
        treatment_type: data.treatmentType,
        blood_group: data.bloodGroup,
        quantity: data.quantity,
        status: 'Pending'
      })
      .select()
      .single();
    if (error) handleError(error);
    return result;
  },
  getAll: async () => {
    const [reqs, hosps] = await Promise.all([
      supabase.from('blood_requirements').select('*').order('created_at', { ascending: false }),
      supabase.from('hospital_requests').select('*').order('created_at', { ascending: false })
    ]);

    if (reqs.error) handleError(reqs.error);
    if (hosps.error) handleError(hosps.error);

    const mappedReqs = (reqs.data || []).map((item: any) => ({
      ...item,
      _source: 'blood_requirements',
      hospitalName: item.hospital_name,
      contactNumber: item.contact_number,
      patientName: item.patient_name,
      treatmentType: item.treatment_type,
      bloodGroup: item.blood_group,
      createdAt: item.created_at
    }));

    const mappedHosps = (hosps.data || []).map((req: any) => hospitalService.mapHospitalRequest(req));

    return [...mappedReqs, ...mappedHosps].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  updateStatus: async (id: string, status: string) => {
    let dbStatus = status;
    if (status === 'Approved') dbStatus = 'ASSIGNED';
    if (status === 'Arranged') dbStatus = 'COMPLETED';
    if (status === 'Rejected') dbStatus = 'REJECTED';

    const { data, error } = await supabase
      .from('blood_requirements')
      .update({ status: dbStatus })
      .eq('id', id);
    if (error) handleError(error);
    return data;
  },
  submitResponse: async (requirementId: string, studentId: string) => {
    const { data, error } = await supabase
      .from('requirement_responses')
      .insert({
        requirement_id: requirementId,
        student_id: studentId,
        status: 'Accepted'
      })
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },
  getResponses: async (requirementId?: string) => {
    let query = supabase
      .from('requirement_responses')
      .select('*, student:profiles(*, student_details(*))');

    if (requirementId) {
      query = query.eq('requirement_id', requirementId);
    }

    const { data, error } = await query;
    if (error) handleError(error);
    return (data || []).map(resp => ({
      ...resp,
      student: mapProfile(resp.student)
    }));
  },
  getMyResponses: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('requirement_responses')
      .select('*')
      .eq('student_id', user.id);

    if (error) handleError(error);
    return data || [];
  },
  updateArrivalStatus: async (responseId: string, status: string) => {
    const { data, error } = await supabase
      .from('requirement_responses')
      .update({ arrival_status: status })
      .eq('id', responseId)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  }
};

export default supabase;
