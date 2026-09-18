import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchNotificationsData = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/notifications/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const mappedNotifications = data.map(n => {
            let icon = 'notifications';
            let iconColor = 'text-blue-600';
            let iconBg = 'bg-blue-50';

            if (n.notification_type === 'candidate_invited') {
              icon = 'person_add';
              iconColor = 'text-indigo-600';
              iconBg = 'bg-indigo-50';
            } else if (n.notification_type === 'email_sent') {
              icon = 'mail';
              iconColor = 'text-sky-600';
              iconBg = 'bg-sky-50';
            } else if (n.notification_type === 'interview_started') {
              icon = 'play_circle';
              iconColor = 'text-green-600';
              iconBg = 'bg-green-50';
            } else if (n.notification_type === 'interview_completed') {
              icon = 'check_circle';
              iconColor = 'text-emerald-600';
              iconBg = 'bg-emerald-50';
            } else if (n.notification_type === 'anomaly_detected') {
              icon = 'warning';
              iconColor = 'text-red-600';
              iconBg = 'bg-red-50';
            }

            return {
              id: n.id,
              title: n.title,
              detail: n.detail,
              time: n.formatted_time,
              unread: n.unread,
              icon: icon,
              iconColor: iconColor,
              iconBg: iconBg
            };
          });

          setNotifications(mappedNotifications);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationsData();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/notifications/${id}/read/`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, unread: false } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/notifications/mark-all-read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/notifications/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/notifications/clear-all/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return n.unread;
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
        <span className="ml-2 font-bold">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notification Center
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Stay updated with candidate progress, screening summaries, and proctoring warnings.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="px-4 md:px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex gap-4">
            {[
              { id: 'all', label: 'All Notifications' },
              { id: 'unread', label: `Unread (${unreadCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100 min-h-[300px]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`px-4 md:px-6 py-5 flex items-start gap-4 transition-colors relative group ${
                  notification.unread ? 'bg-blue-50/20' : 'hover:bg-gray-50/50'
                }`}
              >
                {/* Unread indicator */}
                {notification.unread && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                )}

                {/* Icon */}
                <div className={`${notification.iconBg} ${notification.iconColor} w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm`}>
                  <span className="material-symbols-outlined text-[20px]">{notification.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`text-sm leading-snug truncate ${notification.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap pt-0.5">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
                    {notification.detail}
                  </p>
                  
                  {/* Action row */}
                  <div className="flex items-center gap-4 mt-2.5">
                    {notification.unread && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">drafts</span>
                        Mark as read
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="text-[11px] font-bold text-gray-400 hover:text-red-500 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No notifications found</h3>
              <p className="text-xs text-gray-500">You're all caught up with your pipeline activities!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
