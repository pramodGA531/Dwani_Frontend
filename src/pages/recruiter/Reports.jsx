
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face";

export default function Reports() {
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/interviews/reports/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setReportsList(data);
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleConfirmDelete = (report) => {
    setCandidateToDelete(report);
  };

  const handlePerformDelete = async (report) => {
    setCandidateToDelete(null);
    setDeletingId(report.id);
    
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/interviews/candidate/?email=${encodeURIComponent(report.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setReportsList(prev => prev.filter(r => r.id !== report.id));
        alert("Candidate and associated data deleted successfully.");
      } else {
        alert("Failed to delete candidate from server.");
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      alert("Error deleting candidate from server.");
    } finally {
      setDeletingId(null);
    }
  };

  const reports = reportsList;
  const sortedReports = [...reports].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidate Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Review AI-generated analysis and interview scores for all candidates.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-1 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
              placeholder="Search reports..." 
              type="text" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Reports View */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Candidate</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">AI Score</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Recommendation</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedReports.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-semibold">
                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">description</span>
                    <p>No reports to show</p>
                  </td>
                </tr>
              ) : (
                sortedReports.map((report) => {
                  const isRecommended = report.status === 'Recommended' || report.status === 'Hire' || report.status === 'shortlisted' || report.status?.toLowerCase() === 'recommended';
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                            <img alt={report.name} className="w-full h-full object-cover" src={report.img || defaultAvatar} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{report.name}</div>
                            <div className="text-[12px] text-gray-500 mt-0.5">{report.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center">
                          <span className={`text-xl font-bold ${report.score > 80 ? 'text-blue-600' : report.score > 60 ? 'text-gray-900' : 'text-red-500'}`}>
                            {report.score}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{report.match}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                          report.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : isRecommended 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {report.status === 'shortlisted' ? 'Hired' : report.status === 'rejected' ? 'Rejected' : report.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/report/${report.id}`}
                            className="px-4 py-1.5 text-sm font-semibold text-blue-600 border border-blue-100 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Details
                          </Link>
                          <button 
                            onClick={() => handleConfirmDelete(report)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden divide-y divide-gray-100">
          {sortedReports.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 font-semibold">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">description</span>
              <p>No reports to show</p>
            </div>
          ) : (
            sortedReports.map((report) => {
              const isRecommended = report.status === 'Recommended' || report.status === 'Hire' || report.status === 'shortlisted' || report.status?.toLowerCase() === 'recommended';
              return (
                <div key={report.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                        <img alt={report.name} className="w-full h-full object-cover" src={report.img || defaultAvatar} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{report.name}</div>
                        <div className="text-[11px] text-gray-500">{report.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${report.score > 80 ? 'text-blue-600' : 'text-gray-900'}`}>
                        {report.score}
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{report.match}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="self-start sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        report.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : isRecommended 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {report.status === 'shortlisted' ? 'Hired' : report.status === 'rejected' ? 'Rejected' : report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Link 
                        to={`/report/${report.id}`}
                        className="flex-1 sm:flex-none text-center px-4 py-2.5 text-xs font-bold text-blue-600 border border-blue-100 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        View Report
                      </Link>
                      <button 
                        onClick={() => handleConfirmDelete(report)}
                        className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg border border-gray-100 transition-colors shrink-0 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs mt-8 font-medium">Showing {sortedReports.length} of {sortedReports.length} generated reports</p>

      {/* DELETE CONFIRMATION MODAL */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <h3 className="text-base font-extrabold text-gray-950">Remove Candidate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Remove this candidate and all their screening data (report, resume, and JD) from the system?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePerformDelete(candidateToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-100 transition-colors cursor-pointer"
              >
                Delete Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
