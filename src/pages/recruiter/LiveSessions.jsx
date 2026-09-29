import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

export default function LiveSessions() {
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveSessions = async () => {
      try {
        const queryParams = new URLSearchParams({ page: currentPage });
        if (searchTerm) queryParams.append("search", searchTerm);
        
        const res = await api.get(`/interviews/live-sessions/?${queryParams.toString()}`);
        const data = res.data;
        const results = Array.isArray(data.results) ? data.results : [];
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
        
        const mapped = results.map(item => {
          return {
            id: item.id,
            name: item.candidate_name || item.candidate_email,
            email: item.candidate_email,
            job_title: item.job_title || 'N/A',
            status: 'Interview In Progress',
            session_token: item.session_token,
          };
        });

        setLiveSessions(mapped);
      } catch (err) {
        console.error("Error fetching live sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchLiveSessions();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchLiveSessions, 30000);
    return () => clearInterval(interval);
  }, [currentPage, searchTerm]);

  // Pagination logic
  const currentData = liveSessions;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-1">
      <div className="max-w-7xl mx-auto space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Live Sessions</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Monitor candidates currently taking their interviews.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold border border-emerald-200 flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {totalCount} Active
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && liveSessions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">
                      Loading live sessions...
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-gray-400 text-[24px]">videocam_off</span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold">No active sessions</p>
                          <p className="text-sm text-gray-500 mt-1">There are no candidates currently taking an interview.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                            <img 
                              src={session.profile_picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face"} 
                              alt={session.candidate_name || session.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{session.candidate_name || session.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{session.candidate_email || session.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{session.job_title}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/live-monitoring/${session.session_token || session.id}`, { state: { candidate: session } })}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Monitor
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, liveSessions.length)} of {liveSessions.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
