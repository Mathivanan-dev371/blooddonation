import { supabase } from './supabase';

// Helper to standardise errors
const handleError = (error: any) => {
  let message = error.message || 'An error occurred';

  // Handle Postgres Unique Constraint Errors
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('duplicate key value violates unique constraint')) {
    if (lowerMsg.includes('admission_number') || lowerMsg.includes('registration_number')) {
      message = 'An account with this Registration/Admission Number already exists. Please login.';
    } else if (lowerMsg.includes('email')) {
      message = 'An account with this Email already exists. Please login.';
    } else if (lowerMsg.includes('username')) {
      message = 'This Username is already taken. Please choose another.';
    } else if (lowerMsg.includes('phone_number') || lowerMsg.includes('phone_number_key')) {
      message = 'An account with this Phone Number already exists.';
    } else {
      message = 'An account with this information already exists. Please login instead.';
    }
  }

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
    year: d.year,
    year_semester: d.year_semester || d.year,
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

    // 1. Priority Check: Manual Admin Accounts
    const { data: manualAdmin, error: manualAdminError } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('username', identifier)
      .eq('password', password)
      .maybeSingle();

    if (manualAdmin && !manualAdminError) {
      return {
        user: {
          id: manualAdmin.id || manualAdmin.username, // Fallback to username if id isn't set
          username: manualAdmin.username,
          role: 'ADMIN',
          trustScore: 100,
          isActive: true
        },
        token: 'manual-admin-token-' + manualAdmin.id
      };
    }

    // 2. Priority Check: Manual Hospital Accounts
    const { data: manualHosp, error: manualHospError } = await supabase
      .from('hospital_accounts')
      .select('*')
      .eq('email', identifier) // Often used as identifier
      .eq('password', password)
      .maybeSingle();

    if (manualHosp && !manualHospError) {
      return {
        user: {
          id: manualHosp.id || manualHosp.email, // Fallback to email if id isn't set
          email: manualHosp.email,
          username: manualHosp.hospital_name,
          role: 'HOSPITAL',
          hospital_name: manualHosp.hospital_name,
          location: manualHosp.location,
          trustScore: 100,
          isActive: true
        },
        token: 'manual-hospital-token-' + manualHosp.id
      };
    }

    // 3. Standard Auth: Resolve Username/Admission Number to Email
    let email = identifier;
    if (!identifier.includes('@')) {
      try {
        const { data: studentMatch } = await supabase
          .from('student_details')
          .select('user_id')
          .ilike('admission_number', identifier)
          .maybeSingle();

        if (studentMatch) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', studentMatch.user_id)
            .maybeSingle();
          if (profile?.email) email = profile.email;
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', identifier)
            .maybeSingle();
          if (profile?.email) email = profile.email;
        }
      } catch (e) {
        console.error('Identifier resolution error:', e);
      }
    }

    // If still no valid email and it's not a manual record, then it's a student login error
    if (!identifier.includes('@') && email === identifier) {
      throw new Error('No account found with this Admission Number or Username.');
    }

    // 4. Supabase Auth Attempt
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        throw new Error('Identity verification pending. Please confirm your email address.');
      }
      handleError(authError);
    }

    if (!authData.user) throw new Error('Login failed: No user data returned');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile) {
      throw new Error('Your account is no longer active.');
    }

    return {
      user: { ...authData.user, ...mapProfile(profile) },
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

    // Fetch from hospital_response_tracking
    const { data: trackingData, error: trackingError } = await supabase
      .from('hospital_response_tracking')
      .select('*, hospital_requests(*)')
      .eq('student_id', user.id);

    // Fetch from requirement_responses
    const { data: reqData, error: reqError } = await supabase
      .from('requirement_responses')
      .select('*, blood_requirements(*)')
      .eq('student_id', user.id);

    if (trackingError) console.error(trackingError);
    if (reqError) console.error(reqError);

    const donations: any[] = [];

    (trackingData || []).forEach((t: any) => {
      const req = t.hospital_requests || {};
      const isCompleted = req.status === 'COMPLETED' || t.arrival_status === 'Arrived';
      donations.push({
        id: `hosp-${t.id}`,
        date: t.created_at,
        status: isCompleted ? 'SUCCESS' : 'PENDING',
        hospitalName: req.hospital_name || 'Hospital Request',
        reason: req.purpose || req.treatment_type || 'Requested Donation',
        points: isCompleted ? 5 : 0
      });
    });

    (reqData || []).forEach((r: any) => {
      const req = r.blood_requirements || {};
      const isCompleted = req.status === 'COMPLETED' || req.status === 'Arranged' || r.arrival_status === 'Arrived';
      donations.push({
        id: `req-${r.id}`,
        date: r.created_at,
        status: isCompleted ? 'SUCCESS' : 'PENDING',
        hospitalName: req.hospital_name || 'Emergency Requirement',
        reason: req.treatment_type || 'Emergency Request',
        points: isCompleted ? 5 : 0
      });
    });

    return donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  getAllDonations: async () => {
    return [];
  },
  getStats: async () => {
    return { total: 0, success: 0, pending: 0 };
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

    // Notify Admins about the new hospital request
    if (result) {
      notificationService.notifyAdmins(
        'New Hospital Request',
        `${data.hospitalName} requested ${data.quantity} units of ${data.bloodGroup} blood.`,
        { requestId: result.id, source: 'hospital_requests' }
      ).catch(err => console.error('Failed to notify admins:', err));
    }

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
      notificationSent: req.notification_sent,
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
  registerByAdmin: async (data: { hospitalName: string, email: string, password: string, location: string, phoneNumber: string }) => {
    const { data: result, error } = await supabase
      .from('hospital_accounts')
      .insert({
        hospital_name: data.hospitalName,
        email: data.email,
        password: data.password,
        location: data.location,
        contact_number: data.phoneNumber
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
      createdAt: item.created_at,
      notificationSent: item.notification_sent
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

export const notificationService = {
  saveToken: async (token: string, deviceType: string = 'web', p_user_id?: string) => {
    // 1. Get current Supabase session if no user_id is provided
    let finalId = p_user_id;
    if (!finalId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalId = user?.id;
    }

    if (!finalId) throw new Error('Authentication required to save notification token');

    // 2. Call the master RPC that handles both fcm_tokens table AND fcm_admin column updates
    const { data, error } = await supabase.rpc('save_fcm_token', {
      expo_token: token,
      p_user_id: finalId,
      p_device_type: deviceType
    });

    if (error) handleError(error);
    return data;
  },
  sendRequestNotification: async (request: any) => {
    try {
      console.log('[Notification] Starting broadcast for blood request:', request.bloodGroup);

      // 1. Fetch ALL active expo tokens (Global Broadcast for this request)
      // Passing null to get_tokens_for_notification returns all active tokens
      const { data: tokens, error: tokenError } = await supabase.rpc('get_tokens_for_notification', {
        p_user_ids: null
      });

      if (tokenError) {
        console.error('[Notification] Token fetch error (RPC):', tokenError);
        throw tokenError;
      }

      if (!tokens || tokens.length === 0) {
        console.warn('[Notification] No active tokens found.');
        return { success: true, count: 0 };
      }

      const fcmTokens = tokens.map((t: any) => t.fcm_token);
      console.log(`[Notification] Sending request details to ${fcmTokens.length} tokens...`);

      // 2. Construct enriched message
      const details = [
        `Hospital: ${request.hospitalName}`,
        `Patient: ${request.patientName}${request.patientAge ? ` (${request.patientAge}y)` : ''}`,
        `Purpose: ${request.purpose || 'Emergency'}`,
        `Units: ${request.quantity}`
      ].join('\n');

      // 3. Send directly to Expo Push API
      const messages = fcmTokens.map((token: string) => ({
        to: token,
        sound: 'default',
        title: `🚨 Urgent: ${request.bloodGroup} Blood Required`,
        body: details,
        data: {
          requestId: request.id,
          source: request._source || 'hospital_requests',
          type: 'BLOOD_REQUEST',
          bloodGroup: request.bloodGroup
        }
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(messages)
      });

      // 4. Persistence update
      try {
        const table = request._source === 'hospital_requests' ? 'hospital_requests' : 'blood_requirements';
        await supabase.from(table).update({ notification_sent: true }).eq('id', request.id);
      } catch (dbErr) {
        console.warn('[Notification] Could not update notification_sent flag:', dbErr);
      }

      console.log('[Notification] Broadcast complete!');
      return { success: true, count: tokens.length };
    } catch (error) {
      console.error('[Notification] Fatal error:', error);
      handleError(error);
    }
  },
  notifyAdmins: async (title: string, body: string, data?: any) => {
    try {
      console.log('[Notification] Starting Admin alert broadcast...');

      // 1. Get ALL Admin Identifiers (Supabase Role AND Manual Accounts)
      const [profilesRes, manualRes] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'ADMIN'),
        supabase.from('admin_accounts').select('id, username')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (manualRes.error) throw manualRes.error;

      // Collect all possible IDs (uuid strings, usernames, etc)
      const adminIds = new Set<string>();
      (profilesRes.data || []).forEach(a => adminIds.add(a.id));
      (manualRes.data || []).forEach(a => {
        if (a.id) adminIds.add(String(a.id));
        if (a.username) adminIds.add(String(a.username));
      });

      if (adminIds.size === 0) {
        console.warn('[Notification] No admin accounts found to notify.');
        return { success: true, count: 0 };
      }

      // 2. Use the Master RPC to fetch ALL tokens (Handles all tables)
      const { data: tokens, error: tokenError } = await supabase.rpc(
        'get_tokens_for_notification',
        { p_user_ids: Array.from(adminIds) }
      );

      if (tokenError) throw tokenError;
      if (!tokens || tokens.length === 0) {
        console.warn('[Notification] No active admin tokens found.');
        return { success: true, count: 0 };
      }

      const fcmTokens = tokens.map((t: any) => t.fcm_token);
      console.log(`[Notification] Relaying alert to ${fcmTokens.length} Admin devices...`);

      // 3. Send to Expo Push API
      const messages = fcmTokens.map((token: string) => ({
        to: token,
        sound: 'default',
        title: `🛡️ Admin Alert: ${title}`,
        body: body,
        data: { ...data, type: 'ADMIN_ALERT' }
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(messages)
      });

      return { success: true, count: fcmTokens.length };
    } catch (error) {
      console.error('[Notification] Admin notify failed:', error);
      return { success: false, error };
    }
  },
  broadcastToAll: async (title: string, body: string, data?: any) => {
    try {
      console.log('[Notification] Initiating global broadcast to ALL users via RPC');

      // 1. Use SECURITY DEFINER RPC to fetch ALL active tokens (bypasses RLS)
      const { data: tokens, error: tokenError } = await supabase.rpc(
        'get_tokens_for_notification',
        { p_user_ids: null }
      );

      if (tokenError) {
        console.error('[Notification] Error fetching all tokens (RPC):', tokenError);
        throw tokenError;
      }

      if (!tokens || tokens.length === 0) {
        console.warn('[Notification] No active tokens found for broadcast.');
        return { success: true, count: 0 };
      }

      const fcmTokens = tokens.map((t: any) => t.fcm_token);
      console.log(`[Notification] Sending global broadcast to ${fcmTokens.length} devices...`);

      // 2. Send directly to Expo Push API
      const messages = fcmTokens.map((token: string) => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: {
          ...data,
          type: 'GLOBAL_BROADCAST'
        }
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(messages)
      });

      return { success: true, count: tokens.length };
    } catch (error) {
      console.error('[Notification] Global broadcast failed:', error);
      return { success: false, error };
    }
  },
  notifyUser: async (targetId: string, title: string, body: string, data?: any) => {
    try {
      console.log(`[Notification] Attempting to notify target via RPC: ${targetId}`);

      // 1. Use RPC to find tokens (accepts both user_id or a direct row ID from fcm_tokens)
      // Note: We pass [targetId] to rpc which handles .or() logic if we updated the sql
      const { data: tokens, error } = await supabase.rpc('get_tokens_for_notification', {
        p_user_ids: [targetId]
      });

      if (error) throw error;
      if (!tokens || tokens.length === 0) {
        console.warn('[Notification] No active devices found for target:', targetId);
        return { success: true, count: 0 };
      }

      const fcmTokens = tokens.map((t: any) => t.fcm_token);

      // 2. Send to Expo Push API
      const messages = fcmTokens.map((token: string) => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: { ...data, type: 'DIRECT_TARGET' }
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain', // Use text/plain to bypass CORS preflight
        },
        body: JSON.stringify(messages)
      });

      console.log(`[Notification] Successfully sent to ${fcmTokens.length} devices.`);
      return { success: true, count: fcmTokens.length };
    } catch (error) {
      console.error('[Notification] Targeted notification failed:', error);
      return { success: false, error };
    }
  }
};

export default supabase;
