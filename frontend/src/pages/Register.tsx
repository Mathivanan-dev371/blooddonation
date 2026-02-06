import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import GlobalBackgroundSlideshow from '../components/GlobalBackgroundSlideshow';

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
      alert("Verification mail is sent to your respective email, please verify it!");

    } catch (err: any) {
      console.error('Final Registration Error:', err);
      setError(err.message || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess && registeredStudent) {
    return (
      <div className="min-h-screen relative overflow-hidden font-sans">
        <GlobalBackgroundSlideshow />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">

          <div className="relative z-10 max-w-xl w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-white/70 backdrop-blur-xl border border-purple-100 rounded-[2rem] flex items-center justify-center shadow-xl shadow-purple-200/20 mb-8 animate-pulse text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Access Granted!</h2>
              <p className="mt-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Verification link dispatched to {registeredStudent.email}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-purple-200/20 p-10 border border-purple-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Node Credentials</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-4 border-b border-purple-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">Scholar Name</span>
                  <span className="text-sm font-black text-slate-800 uppercase leading-none">{registeredStudent.name}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-purple-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">Admission ID</span>
                  <span className="text-sm font-black text-slate-800 uppercase leading-none">{registeredStudent.admissionNumber}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-purple-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">Phone Terminal</span>
                  <span className="text-sm font-black text-slate-800 leading-none">{registeredStudent.phoneNumber}</span>
                </div>
                <div className="flex justify-between py-4 border-b border-purple-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">Blood Signature</span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-red-50 text-red-600 border border-red-100">{registeredStudent.bloodGroup}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-1">Identity Node</span>
                  <span className="text-sm font-black text-slate-800 uppercase leading-none">{registeredStudent.collegeName}</span>
                </div>
              </div>

              <div className="mt-10 pt-4">
                <Link to="/login" className="block w-full py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] rounded-[2rem] text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95">
                  Initialize Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <GlobalBackgroundSlideshow />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">

        <Link
          to="/"
          className="absolute top-6 right-6 z-50 flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-xl border border-purple-100 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </Link>

        <div className="relative z-10 max-w-2xl w-full">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Scholar Enrollment Pipeline</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">New Node <span className="text-indigo-600">Initiation</span></h2>
            <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Provide your credentials to join the network</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-purple-200/20 p-10 border border-purple-100 relative overflow-hidden group">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                  <input name="name" type="text" required placeholder="Full Name" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <input name="department" type="text" required placeholder="e.g., Computer Science" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800" value={formData.department} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission ID</label>
                  <input name="admissionNumber" type="text" required placeholder="Registration No" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800" value={formData.admissionNumber} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Terminal</label>
                  <input name="phoneNumber" type="tel" required placeholder="10 Digits" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800" value={formData.phoneNumber} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Signature</label>
                  <select name="bloodGroup" required className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-black text-sm text-slate-800 cursor-pointer appearance-none" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Signature</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Host</label>
                  <select name="collegeName" required className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-black text-sm text-slate-800 cursor-pointer appearance-none" value={formData.collegeName} onChange={handleChange}>
                    <option value="">Host College</option>
                    {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Routing (Email)</label>
                  <input name="email" type="email" required placeholder="scholar@email.com" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800 tracking-widest" value={formData.password} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Key</label>
                  <input name="confirmPassword" type="password" required placeholder="••••••••" className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm text-slate-800 tracking-widest" value={formData.confirmPassword} onChange={handleChange} />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all transform active:scale-95 h-16 flex items-center justify-center">
                  {loading ? (
                    <span className="flex items-center space-x-3">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Configuring Node...</span>
                    </span>
                  ) : 'Initiate Enrollment'}
                </button>
              </div>
            </form>
            <div className="mt-8 text-center pt-8 border-t border-purple-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Already integrated? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 transition-all ml-1 underline decoration-2 underline-offset-4">Authorize Entry</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
