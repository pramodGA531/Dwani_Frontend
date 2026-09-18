import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Header() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/notifications/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const notifications = await res.json();
          const activeUnread = notifications.some(n => n.unread);
          setHasUnread(activeUnread);
        }
      } catch (err) {
        console.error("Failed to check unread notifications count", err);
      }
    };

    checkUnread();
    
    // Check every 15 seconds to keep it dynamic and fresh
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] lg:h-14 lg:pt-0 flex items-center justify-between lg:justify-end gap-3 px-4 md:px-6 bg-white border-b border-gray-200 w-full flex-shrink-0 z-40 transition-all">
      {/* Mobile Logo */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[16px]">work</span>
        </div>
        <span className="text-sm font-bold text-gray-900">Recruiter</span>
      </div>

      <div className="flex items-center gap-3">
        <Link 
          to="/notifications" 
          className="relative cursor-pointer p-2 -m-1 text-gray-600 hover:text-gray-900 transition-all hover:bg-gray-50 rounded-full active:scale-95 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[22px] lg:text-[20px]">notifications</span>
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
        </Link>

        {/* Profile / Avatar */}
        <Link 
          to="/profile"
          className="h-8 w-8 lg:h-9 lg:w-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-blue-100 hover:border-blue-300 active:scale-95 shrink-0"
        >
          <img 
            alt="User avatar" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmvBX-647LA6O6SIxndP35O-gyyWWjhbQDE5zZU-AprQZijFLPhOU7d6TNzZLX7MA5S1pXbrPZNawPbMdwUMhudKoaKDHiR-liCZ9yCDmQw6JNMy6Qqw8152Ym-mQ6VOnCKm3EUgkExjSXurU23AFGCfDgynLfxUYMKyNWlYWS-EfTjZjYEzKNNiiX8OpSW4oIfQ3okofRLPTOHLrbRrQQIHivtX0-8vbQIaKshHJDeKENclpRaQafLg5vnppQpf9cuifRg_PaqxE" 
          />
        </Link>
      </div>
    </header>
  );
}
