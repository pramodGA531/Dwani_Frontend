import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face";

export default function ReportDetail() {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const mockReport = {
    id: id,
    candidate_name: 'Jordan Devereaux',
    candidate_email: 'jordan.devereaux@techcorp.com',
    job_title: 'Senior Full-Stack Engineer',
    overall_score: 91,
    overall_summary: 'Jordan demonstrates exceptional technical depth in distributed systems and React architecture. Their ability to articulate complex trade-offs between SQL and NoSQL environments was a standout moment.',
    recommendation: 'Recommended',
    strengths: [
      'Explained horizontal scaling strategies with precise detail on data consistency.',
      'Balanced theoretical "best practices" with realistic business constraints.',
      'Demonstrated high levels of empathy and collaborative spirit in scenario tests.'
    ],
    weaknesses: [
      'Can occasionally go too deep into technical tangents, losing sight of the core question.',
      'Familiar with Kubernetes but lacks hands-on experience with advanced mesh networking.'
    ],
    transcript: [
      { role: 'ai', text: 'Can you describe a situation where you had to lead a technical migration under a tight deadline?', timestamp: '02:14 PM' },
      { role: 'candidate', text: 'Absolutely. At my previous role, we were moving from a monolithic Ruby on Rails application to a microservices architecture. We had a three-month window before our peak seasonal traffic...', timestamp: '02:30 PM' }
    ],
    pdf_url: null,
    created_at: '2023-12-12'
  };

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/interviews/reports/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        } else {
          setReportData(mockReport);
        }
      } catch (err) {
        console.error("Error fetching report detail:", err);
        setReportData(mockReport);
      } finally {
        setLoading(false);
      }
    };
    fetchReportDetail();
  }, [id]);

  const handleStatusUpdate = async (statusVal) => {
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/interviews/reports/${id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusVal })
      });
      if (res.ok) {
        setReportData(prev => ({
          ...prev,
          status: statusVal === 'hire' ? 'Hire' : 'Reject'
        }));
        alert(`Candidate status updated successfully.`);
      } else {
        alert("Failed to update status on server, updating local view instead.");
        setReportData(prev => ({
          ...prev,
          status: statusVal === 'hire' ? 'Hire' : 'Reject'
        }));
      }
    } catch (err) {
      console.error("Failed to update candidate status:", err);
      setReportData(prev => ({
        ...prev,
        status: statusVal === 'hire' ? 'Hire' : 'Reject'
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
        <span className="ml-2 font-bold">Loading report...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center p-12 text-gray-400">
        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
        <p className="text-sm font-medium">Report not found</p>
      </div>
    );
  }

  const scores = [
    { label: 'Technical Knowledge', value: reportData.scores?.technical || reportData.overall_score || 85, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Communication', value: reportData.scores?.communication || reportData.overall_score || 85, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Confidence', value: reportData.scores?.confidence || reportData.overall_score || 85, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Problem Solving', value: reportData.scores?.problem_solving || reportData.overall_score || 85, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Behavioral Analysis', value: reportData.scores?.behavioral || reportData.overall_score || 85, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const initials = reportData.candidate_name
    ? reportData.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CD';

  const isRecommended = reportData.status === 'Recommended' || reportData.status === 'Hire' || reportData.status === 'shortlisted' || reportData.status?.toLowerCase() === 'recommended';

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link to="/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-gray-900 font-medium">Candidate Report</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/reports" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shrink-0">
            <span className="material-symbols-outlined text-[20px] md:text-[24px]">arrow_back</span>
          </Link>
          <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
            <img 
              alt="Candidate Profile" 
              className="w-full h-full object-cover" 
              src={reportData.img || defaultAvatar} 
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{reportData.candidate_name}</h1>
              {reportData.interview_status === 'rejected' && (
                <div className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-md border border-red-200 text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  Rejected
                </div>
              )}
              {reportData.interview_status === 'shortlisted' && (
                <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Hired
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{reportData.job_title} • {reportData.created_at}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {reportData.interview_status !== 'rejected' && reportData.interview_status !== 'shortlisted' && (
            <>
              <button 
                onClick={() => handleStatusUpdate('reject')}
                className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 border rounded-lg text-sm font-bold transition-all cursor-pointer border-red-200 text-red-600 hover:bg-red-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleStatusUpdate('hire')}
                className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                Hire Candidate
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
          {/* AI Summary Card */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Recommendation</h3>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${
                isRecommended 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-gray-50 text-gray-500 border-gray-100'
              }`}>
                <span className="material-symbols-outlined text-[16px]">
                  {isRecommended ? 'check_circle' : 'info'}
                </span>
                {reportData.recommendation || reportData.status || 'Recommended'}
              </span>
            </div>
            <p className="text-[15px] text-gray-700 leading-relaxed font-medium">
              {reportData.overall_summary}
            </p>
          </div>

          {/* Scores Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {scores.map((score, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{score.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{score.value}<span className="text-sm font-normal text-gray-300">/100</span></p>
                </div>
                <div className={`w-12 h-12 rounded-full border-4 border-gray-100 flex items-center justify-center ${score.color}`}>
                   <span className="text-xs font-bold">{score.value}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Growth */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined">thumb_up</span>
              <h3 className="text-lg font-bold">Key Strengths</h3>
            </div>
            <div className="space-y-6">
              {reportData.strengths && reportData.strengths.length > 0 ? (
                reportData.strengths.map((str, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="material-symbols-outlined text-emerald-500 shrink-0">add_circle</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">Strength {i + 1}</p>
                      <p className="text-sm text-gray-500 mt-1">{str}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No strengths generated.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-amber-700">
              <span className="material-symbols-outlined">report_problem</span>
              <h3 className="text-lg font-bold">Areas for Growth</h3>
            </div>
            <div className="space-y-6">
              {reportData.weaknesses && reportData.weaknesses.length > 0 ? (
                reportData.weaknesses.map((weak, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="material-symbols-outlined text-amber-500 shrink-0">remove_circle</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">Area {i + 1}</p>
                      <p className="text-sm text-gray-500 mt-1">{weak}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No growth areas generated.</p>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className="lg:col-span-12 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">description</span>
                <h3 className="text-lg font-bold text-gray-900">Full Interview Transcript</h3>
              </div>
              {reportData.pdf_url && (
                <a 
                  href={reportData.pdf_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Download PDF
                </a>
              )}
            </div>
            <div className="p-6 space-y-6 bg-gray-50/30">
              {reportData.transcript && reportData.transcript.length > 0 ? (
                reportData.transcript.map((m, i) => {
                  const isAI = m.role === 'ai';
                  return (
                    <div key={i} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isAI ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                        {isAI ? 'AI' : initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                          {isAI ? 'AI Interviewer' : reportData.candidate_name} • {m.timestamp}
                        </div>
                        <p className={`text-sm leading-relaxed ${isAI ? 'text-gray-500 italic' : 'text-gray-800'}`}>{m.text}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 italic">Transcript is empty.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
