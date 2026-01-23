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
    registrationNumber: d.registration_number,
    dateOfBirth: d.date_of_birth,
    phoneNumber: d.phone_number,
    bloodGroup: d.blood_group,
    //year_semester is already used as year_semester in dashboard
  };
};

const mapProfile = (profile: any) => {
  if (!profile) return null;
  return {
    ...profile,
    trustScore: profile.trust_score ?? 50,
    isAvailable: profile.is_available ?? false,
    isActive: profile.is_active ?? true,
    studentDetails: mapStudentDetails(profile.student_details),
  };
};

export const authService = {
  setToken: (_token: string | null) => {
    // Supabase handles session automatically, but we can set it if needed manually
    // or just ignore if we trust the persistent session.
  },
  login: async (usernameOrEmail: string, password: string) => {
    let email = usernameOrEmail;

    // Check if input is likely a username (no @)
    if (!usernameOrEmail.includes('@')) {
      const { data: profile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameOrEmail)
        .maybeSingle();

      if (profileLookupError) handleError(profileLookupError);
      if (!profile || !profile.email) {
        throw new Error('User not found with that username');
      }
      email = profile.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) handleError(error);
    if (!data.user) throw new Error('Login failed: No user data returned');

    // Fetch profile and details to match previous API response structure
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, student_details(*)')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile during login:', profileError);
    }

    if (!profile) {
      console.warn('Profile not found for user during login');
      // We still return the user so they are "logged in" but might have limited access
      return {
        user: { ...data.user, role: 'STUDENT' }, // Default role if profile missing
        token: data.session?.access_token,
      };
    }

    const mappedProfile = mapProfile(profile);

    return {
      user: { ...data.user, ...mappedProfile },
      token: data.session?.access_token,
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
          registration_number: details.registrationNumber,
          date_of_birth: details.dateOfBirth,
          age: parseInt(details.age) || 0,
          phone_number: details.phoneNumber,
          blood_group: details.bloodGroup,
          department: details.department,
          year_semester: details.year_semester,
        },
      },
    });

    if (authError) handleError(authError);
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
    // NOTE: Deleting from auth.users via client is usually not allowed directly 
    // without service key or admin function. 
    // But we can delete from profiles if cascading is set up, 
    // however auth user remains.
    // Ideally we call an Edge Function or RPC.
    // For now, we will just delete from profiles and assume auth user clean up is manual or handled elsewhere
    // Or we just deactivate.
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) handleError(error);
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
  createRequest: async (data: { bloodGroup: string, quantity: number, hospitalName: string, hospitalAddress: string, arrivalTime: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from('hospital_requests')
      .insert({
        hospital_id: user?.id,
        blood_group: data.bloodGroup,
        quantity: data.quantity,
        hospital_name: data.hospitalName,
        hospital_address: data.hospitalAddress,
        arrival_time: data.arrivalTime
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
      bloodGroup: req.blood_group,
      hospitalName: req.hospital_name,
      hospitalAddress: req.hospital_address,
      arrivalTime: req.arrival_time,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    };
  },
  getMyRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('hospital_requests')
      .select('*')
      .eq('hospital_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (error) handleError(error);
    return (data || []).map((req: any) => hospitalService.mapHospitalRequest(req));
  },
  getEligibleDonors: async (requestId: string) => {
    // Fetch request to get blood group
    const { data: req } = await supabase.from('hospital_requests').select('blood_group').eq('id', requestId).single();
    if (!req) throw new Error('Request not found');

    // Fetch donors with that blood group
    const { data, error } = await supabase
      .from('student_details')
      .select('*, user:profiles(*)')
      .eq('blood_group', req.blood_group)
      // Check availability via user profile
      // This requires complex filtering on joined table which Supabase supports
      .eq('user.is_available', true);

    // Note: checking nested filter 'user.is_available' might need !inner join syntax

    if (error) handleError(error);
    return data;
  },
  assignDonors: async (requestId: string, donorIds: string[]) => {
    // Update hospital request assigned_donors array
    const { data, error } = await supabase
      .from('hospital_requests')
      .update({ assigned_donors: donorIds, status: 'ASSIGNED' })
      .eq('id', requestId)
      .select()
      .single();

    // Also potentially create donation attempts for them?
    // Logic from original backend might imply this.
    // For now just update the request.

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
};

export default supabase;
