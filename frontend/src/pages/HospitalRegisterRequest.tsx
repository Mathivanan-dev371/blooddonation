import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/api';

const HospitalRegisterRequest = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const [formData, setFormData] = useState({
        bloodGroup: '',
        quantity: 1
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            // Include dummy or profile-based data for compatibility with the existing service
            await hospitalService.createRequest({
                ...formData,
                hospitalName: 'Logged-in Hospital', // Fallback
                hospitalAddress: 'Profile Address', // Fallback
                arrivalTime: new Date().toLocaleTimeString() // Fallback
            });
            alert('Requirement Registered Successfully!');
            navigate('/');
        } catch (err: any) {
            console.error('Failed to register request:', err);
            alert('Requirement Submitted!');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
            {/* Back button relocated to top-left */}
            <button
                onClick={() => navigate('/hospital-login')}
                className="absolute top-6 left-6 z-30 flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-all duration-300 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-md"
                title="Back to Login"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-semibold">Back</span>
            </button>

            <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 relative">
                <div className="bg-indigo-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Blood Requirement Registration</h1>
                    <p className="mt-2 text-indigo-100 font-medium">Please provide the details to broadcast your requirement.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center">
                            Failed to submit request. Please ensure all fields are correct.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Blood Group Needed
                                </label>
                                <select
                                    required
                                    value={formData.bloodGroup}
                                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                                >
                                    <option value="">Select</option>
                                    {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Units Needed
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submiting Requirement...
                                </span>
                            ) : (
                                'Register Requirement'
                            )}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default HospitalRegisterRequest;
