import { useNavigate } from 'react-router-dom';
import GlobalBackgroundSlideshow from '../components/GlobalBackgroundSlideshow';

const UserSelection = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'student',
            title: 'Student Donor',
            description: 'Donate blood, manage your profile, and track your impact.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            ),
            path: '/login',
            color: 'from-red-500 to-rose-600',
            borderColor: 'border-red-200'
        },
        {
            id: 'hospital',
            title: 'Hospital / Clinic',
            description: 'Request blood units, manage emergencies, and coordinate with donors.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            path: '/hospital-login',
            color: 'from-blue-500 to-indigo-600',
            borderColor: 'border-blue-200'
        },
        {
            id: 'admin',
            title: 'Administrator',
            description: 'System-wide management, data analytics, and user moderation.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            path: '/admin-login',
            color: 'from-slate-700 to-slate-900',
            borderColor: 'border-slate-300'
        }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-100">
            <GlobalBackgroundSlideshow />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-6xl text-center space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight bg-white/80 backdrop-blur-md px-4 sm:px-8 py-3 sm:py-4 rounded-2xl inline-block shadow-lg">
                            Welcome to <span className="text-red-600">BloodLine</span>
                        </h1>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => navigate(role.path)}
                                className="group relative flex flex-col items-center p-6 sm:p-8 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left"
                            >
                                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${role.color} text-white mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                    {role.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                                    {role.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed text-center">
                                    {role.description}
                                </p>

                                <div className="mt-8 flex items-center text-sm font-bold text-red-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    Get Started
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                {/* Decorative corner */}
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${role.color} opacity-5 group-hover:scale-[10] transition-transform duration-700 pointer-events-none`}></div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-1 text-gray-900 text-sm font-bold bg-white/60 backdrop-blur-md px-3 py-3 rounded-xl inline-block shadow-sm">
                        &copy;SONA INSTITUITIONS. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Marquee Credits */}
            <div className="fixed bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-md py-3 overflow-hidden z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-red-400/30">
                <div className="whitespace-nowrap animate-marquee">
                    <span className="text-white font-black uppercase tracking-[0.2em] text-sm px-4">
                        Presented by: MATHI - II Year • PRASANA - III Year • SANJAY - II Year • VARSHINI - II Year • PRIYA - II Year • PAVITHRA - II Year
                    </span>
                    {/* Repeated for seamless flow if needed, but 25s for one pass is fine. 
                        Let's duplicate it once to ensure there's no gap when the first one finishes. */}
                    <span className="text-white font-black uppercase tracking-[0.2em] text-sm px-4" aria-hidden="true">
                        Presented by: MATHI - II Year • PRASANA - III Year • SANJAY - II Year • VARSHINI - II Year • PRIYA - II Year • PAVITHRA - II Year
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserSelection;
