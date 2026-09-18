

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    total_jobs: 0,
    total_candidates: 0,
    active_interviews: 0,
    activities: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/interviews/dashboard-stats/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Jobs', value: statsData.total_jobs.toString(), icon: 'work', change: 'Active postings', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Candidates', value: statsData.total_candidates.toString(), icon: 'group', change: 'All time', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Interviews', value: statsData.active_interviews.toString(), icon: 'video_chat', change: 'Live tracking', color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const activities = statsData.activities || [];

  const filteredActivities = activities.filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    activity.detail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1">Welcome back. Here's what's happening with your hiring pipeline today.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3.5 sm:p-5 flex flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className={`${stat.bg} ${stat.color} p-1.5 sm:p-2 rounded-lg`}>
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{stat.icon}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {stat.change}
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{stat.value}</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Activity</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs sm:text-sm text-blue-600 font-bold hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 font-semibold">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">history</span>
              <p>No recent activity</p>
            </div>
          ) : (
            activities.slice(0, 3).map((activity, i) => (
              <div key={i} className="px-3.5 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`${activity.iconBg} ${activity.iconColor} w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-sm font-bold text-gray-900 truncate leading-tight">{activity.title}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{activity.detail}</p>
                </div>
                <div className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap ml-2 shrink-0">
                  {activity.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View All Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">All Recent Activity</h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Hiring pipeline and system audit trails</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery('');
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search Activity */}
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                <input 
                  type="text"
                  placeholder="Search activity by title or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Modal Body / Activities List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white min-h-[300px]">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, i) => (
                  <div key={i} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors">
                    <div className={`${activity.iconBg} ${activity.iconColor} w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight">{activity.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">{activity.detail}</p>
                    </div>
                    <div className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap self-start mt-1 ml-2 shrink-0">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                  <p className="text-sm font-medium">No activities match your search</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery('');
                }}
                className="px-4 sm:px-5 py-2 bg-gray-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
