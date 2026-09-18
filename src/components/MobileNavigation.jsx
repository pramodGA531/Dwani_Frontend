import React from 'react';
import { MonitorCheck, Clock, Video, BarChart2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: MonitorCheck, label: 'Check', path: '/system-check' },
    { icon: Clock, label: 'Wait', path: '/waiting-room' },
    { icon: Video, label: 'Interview', path: '/interview' },
    { icon: BarChart2, label: 'Results', path: '/results' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 pb-safe pt-3 px-2 sm:px-6 flex justify-between items-center z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-300 min-w-[64px] min-h-[44px] justify-center ${active ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <div className={`w-12 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-indigo-50 shadow-inner' : 'bg-transparent'}`}>
              <item.icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'scale-110' : ''} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
