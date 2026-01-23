import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface RegisteredStudent {
  name: string;
  department: string;
  admissionNumber: string;
  bloodGroup: string;
  collegeName: string;
  email: string;
}

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    admissionNumber: '',
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
    // Check for duplicate admission number
    const { data: admissionData } = await supabase
      .from('student_donors')
      .select('admission_number')
      .eq('admission_number', formData.admissionNumber)
      .single();

    if (admissionData) {
      return 'A student with this admission number already exists';
    }

    // Check for duplicate email
    const { data: emailData } = await supabase
      .from('student_donors')
      .select('email')
      .eq('email', formData.email)
      .single();

    if (emailData) {
      return 'A student with this email already exists';
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

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Insert student details into database
      const { error: insertError } = await supabase
        .from('student_donors')
        .insert({
          user_id: authData.user?.id,
          name: formData.name,
          department: formData.department,
          admission_number: formData.admissionNumber,
          blood_group: formData.bloodGroup,
          college_name: formData.collegeName,
          email: formData.email,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Set success state and show registered details
      setRegisteredStudent({
        name: formData.name,
        department: formData.department,
        admissionNumber: formData.admissionNumber,
        bloodGroup: formData.bloodGroup,
        collegeName: formData.collegeName,
        email: formData.email,
      });
      setIsSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Success screen showing registered student details
  if (isSuccess && registeredStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background elements */}
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
            <h2 className="text-3xl font-extrabold text-gray-900">
              Registration Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome to the BloodLine community
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Your Registration Details
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Full Name</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.name}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Department</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.department}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Admission Number</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.admissionNumber}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Blood Group</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                  {registeredStudent.bloodGroup}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-500 font-medium">College</span>
                <span className="text-gray-900 font-semibold text-right max-w-[200px]">{registeredStudent.collegeName}</span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500 font-medium">Email</span>
                <span className="text-gray-900 font-semibold">{registeredStudent.email}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                to="/login"
                className="block w-full py-3 px-4 text-center text-sm font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Proceed to Login
              </Link>
              <Link
                to="/"
                className="block w-full py-3 px-4 text-center text-sm font-semibold rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-red-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-100 rounded-full blur-[100px]"></div>
      </div>

      {/* Back button */}
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-all duration-300 bg-gray-100/50 hover:bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm z-20"
        title="Back to Login"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-semibold">Back</span>
      </Link>

      <div className="relative z-10 max-w-xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our blood donation community
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-1">
                  Department *
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  placeholder="e.g., Computer Science, Mechanical"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>

              {/* Admission Number */}
              <div>
                <label htmlFor="admissionNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                  Admission Number *
                </label>
                <input
                  id="admissionNumber"
                  name="admissionNumber"
                  type="text"
                  required
                  placeholder="Enter your admission number"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Blood Group */}
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1">
                  Blood Group *
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* College Name Dropdown */}
              <div>
                <label htmlFor="collegeName" className="block text-sm font-semibold text-gray-700 mb-1">
                  College Name *
                </label>
                <select
                  id="collegeName"
                  name="collegeName"
                  required
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                  value={formData.collegeName}
                  onChange={handleChange}
                >
                  <option value="">Select College</option>
                  {colleges.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Create a password (min. 6 characters)"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirm your password"
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Registering...</span>
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-red-600 hover:text-red-500 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
