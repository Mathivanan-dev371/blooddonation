import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface RegisteredStudent {
  name: string;
  department: string;
  admissionNumber: string;
  phoneNumber: string;
  bloodGroup: string;
  collegeName: string;
  email: string;
}

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    admissionNumber: '',
    phoneNumber: '',
    bloodGroup: '',
    collegeName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState<RegisteredStudent | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const colleges = [
    'Sona College of Technology',
    'Sona College of Arts and Science',
    'Thiagarajar Polytechnic College',
    'Sona School of Business and Management',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkDuplicates = async () => {
    // Check for duplicate admission number (registration_number in student_details)
    const { data: admissionData } = await supabase
      .from('student_details')
      .select('admission_number')
      .eq('admission_number', formData.admissionNumber)
      .maybeSingle();

    if (admissionData) {
      return 'A student with this admission number already exists';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Check for duplicates first
      const duplicateError = await checkDuplicates();
      if (duplicateError) {
        setError(duplicateError);
        setLoading(false);
        return;
      }

      // 1. Sign Up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'STUDENT',
            admission_number: formData.admissionNumber,
            phone_number: formData.phoneNumber,
            blood_group: formData.bloodGroup,
            department: formData.department,
            college_name: formData.collegeName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Account creation failed.');

      const userId = authData.user.id;

      // 2. Create the profile manually
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: formData.email,
          username: formData.name,
          role: 'STUDENT',
          is_active: true,
          is_available: true
        });

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
      }

      // 3. Save student details including phone number
      const { error: detailsError } = await supabase
        .from('student_details')
        .upsert({
          user_id: userId,
          name: formData.name,
          admission_number: formData.admissionNumber,
          phone_number: formData.phoneNumber,
          department: formData.department,
          blood_group: formData.bloodGroup,
          year_semester: formData.collegeName,
          college_name: formData.collegeName,
          status: 'Active'
        });

      if (detailsError) throw detailsError;

      // Set success state
      setRegisteredStudent({
        name: formData.name,
        department: formData.department,
        admissionNumber: formData.admissionNumber,
        phoneNumber: formData.phoneNumber,
        bloodGroup: formData.bloodGroup,
        collegeName: formData.collegeName,
        email: formData.email,
      });
      setIsSuccess(true);
      alert("verification mail is sent to your respective email,verify it !!");

    } catch (err: any) {
      console.error('Final Registration Error:', err);
      setError(err.message || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess && registeredStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-green-100 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-emerald-100 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-xl w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-green-600 font-bold">verification mail is sent to your respective email, verify it !!</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Your Registration Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Admission Number</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.admissionNumber}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Phone Number</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Blood Group</span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">{registeredStudent.bloodGroup}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">College</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.collegeName}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.email}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link to="/login" className="block w-full py-3 text-center text-sm font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-lg">
                Proceed to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-red-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-100 rounded-full blur-[100px]"></div>
      </div>

      <Link
        to="/"
        className="fixed top-6 right-6 flex items-center space-x-2 text-slate-500 hover:text-red-600 transition-all duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-md z-50"
        title="Back to Selection"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-semibold">Back</span>
      </Link>

      <div className="relative z-10 max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Student Registration</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input name="name" type="text" required className="w-full border p-3 rounded-lg" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                <input name="department" type="text" required className="w-full border p-3 rounded-lg" value={formData.department} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Number *</label>
                <input name="admissionNumber" type="text" required className="w-full border p-3 rounded-lg" value={formData.admissionNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                <input name="phoneNumber" type="tel" required placeholder="10-digit number" className="w-full border p-3 rounded-lg" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group *</label>
                <select name="bloodGroup" required className="w-full border p-3 rounded-lg bg-white" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">College *</label>
                <select name="collegeName" required className="w-full border p-3 rounded-lg bg-white" value={formData.collegeName} onChange={handleChange}>
                  <option value="">Select College</option>
                  {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" required className="w-full border p-3 rounded-lg" value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                <input name="password" type="password" required className="w-full border p-3 rounded-lg" value={formData.password} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
                <input name="confirmPassword" type="password" required className="w-full border p-3 rounded-lg" value={formData.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 transition-all shadow-lg hover:shadow-xl">
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-red-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
