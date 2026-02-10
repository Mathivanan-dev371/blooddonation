import { useNavigate } from 'react-router-dom';
import GlobalBackgroundSlideshow from '../components/GlobalBackgroundSlideshow';

const UserSelection = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'student',
            title: 'Student Donor',
            description: 'Provide life-saving support, manage your profile, and monitor your social impact within the network.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
            ),
            path: '/login',
            color: 'from-blue-900 to-blue-950',
            textColor: 'text-blue-900',
            topBorder: 'border-t-blue-600'
        },
        {
            id: 'hospital',
            title: 'Hospital Node',
            description: 'Register urgent requirements, coordinate emergency logistics, and access the verified donor pool.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            path: '/hospital-login',
            color: 'from-red-600 to-red-700',
            textColor: 'text-red-600',
            topBorder: 'border-t-red-600'
        },
        {
            id: 'admin',
            title: 'Administrator Portal',
            description: 'Network moderation, secure data analytics, and comprehensive system oversight.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            path: '/admin-login',
            color: 'from-slate-800 to-slate-900',
            textColor: 'text-slate-800',
            topBorder: 'border-t-slate-800'
        }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden">
            <GlobalBackgroundSlideshow />

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 pb-24">
                <div className="w-full max-w-6xl text-center space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.05em] uppercase block leading-tight">
                            <span className="text-black px-1">WELCOME TO</span>
                            <span className="text-red-600 px-1">SONA BLOODLINE</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Select your portal to access the ecosystem</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => navigate(role.path)}
                                className={`group relative flex flex-col items-center p-10 bg-white/80 backdrop-blur-xl border-x border-b border-purple-100 ${role.topBorder} border-t-8 rounded-[3rem] shadow-xl shadow-purple-200/20 hover:shadow-2xl hover:shadow-indigo-200/30 transition-all duration-500 hover:-translate-y-2 text-center`}
                            >
                                <div className={`p-5 rounded-3xl bg-gradient-to-br ${role.color} text-white mb-8 transform group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-indigo-100`}>
                                    {role.icon}
                                </div>
                                <h3 className={`text-xl font-black ${role.textColor} mb-4 uppercase tracking-tight`}>
                                    {role.title}
                                </h3>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed">
                                    {role.description}
                                </p>

                                <div className="mt-8 flex items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    Authorize Access
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        &copy; SONA BLOODLINE. Institutional Logistics Network
                    </div>
                </div>
            </div>

            {/* Marquee Credits */}
            <div className="fixed bottom-0 left-0 right-0 bg-red-600 py-4 overflow-hidden z-20 shadow-[0_-4px_20px_rgba(220,38,38,0.2)] border-t border-red-400/30">
                <div className="whitespace-nowrap animate-marquee flex items-center">
                    {[1, 2, 3, 4].map((i) => (
                        <span key={i} className="text-white font-black uppercase tracking-[0.2em] text-[10px] px-8">
                            DEVELOPED BY : PRASANNA | SANJAY | MATHIVANNA | VASUDEV | PRIYA VARSHINI | PAVITHRA | MOHANAPRIYA
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserSelection;
