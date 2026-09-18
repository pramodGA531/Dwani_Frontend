import { useState, useEffect } from 'react';
import { 
  EmptyCard, 
  SelectedCard, 
  LoadingCard, 
  JDSuccessCard, 
  ResumeSuccessCard 
} from '@/components/candidates/AIUploadCard';
import CandidateCard from '@/components/common/CandidateCard';
import CandidateDeepView from '@/components/candidates/CandidateDeepView';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Jobs() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'screen' or 'pipeline'
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // New state for extracted data
  const [jobConfig, setJobConfig] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showDeepView, setShowDeepView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // Scheduling state for loading indicator
  const [schedulingCandidateId, setSchedulingCandidateId] = useState(null);

  // Delete candidate states
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Interview configuration state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [candidateToConfigure, setCandidateToConfigure] = useState(null);
  const [dialogOption, setDialogOption] = useState('5'); // '5', '10', '15', '20', 'custom'
  const [dialogCustomValue, setDialogCustomValue] = useState('5');
  const [customError, setCustomError] = useState("");
  const [questionCountState, setQuestionCountState] = useState({ questionCount: 5 });

  // Pipeline Tabs and Pagination states
  const [pipelineSubTab, setPipelineSubTab] = useState('all'); // 'all', 'awaiting_invite', 'scheduled_live', 'completed', 'hired', 'rejected'
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [pipelineSubTab, activeTab]);

  // Screened list from LocalStorage or seed data
  const [screenedList, setScreenedList] = useState(() => {
    const userEmail = localStorage.getItem('email') || 'default';
    const saved = localStorage.getItem(`screened_candidates_${userEmail}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(c => !String(c.id).startsWith('mock-'));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('access');
        const res = await fetch(`${API_BASE}/interviews/interviews/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data) ? data : (data.results || []);
          const mapped = results.map(item => ({
            id: item.id,
            name: item.candidate_name || item.candidate_email,
            email: item.candidate_email,
            ats_score: Math.round(item.ats_score || 0),
            screened_at: new Date(item.created_at).toLocaleDateString(),
            job_title: item.job_title,
            skills: item.skills || [],
            highlights: item.highlights || [],
            resume_text: item.resume_text,
            status: item.status === 'pending' ? 'Interview Pending' : 
                    item.status === 'in_progress' ? 'Interview In Progress' :
                    item.status === 'completed' ? 'Interview Completed' : item.status,
            session_token: item.session_token
          }));
          
          const userEmail = localStorage.getItem('email') || 'default';
          let localCandidates = JSON.parse(localStorage.getItem(`screened_candidates_${userEmail}`) || '[]');
          localCandidates = localCandidates.filter(c => !String(c.id).startsWith('mock-'));
          
          // Create a map of API candidates by id for easy lookup
          const apiCandidateMap = new Map();
          mapped.forEach(c => apiCandidateMap.set(c.id, c));

          // Merge: For each local candidate, if they exist in API, use API data (to get updated status), else keep local
          const mergedList = localCandidates.map(localCand => {
            if (apiCandidateMap.has(localCand.id)) {
              const apiCand = apiCandidateMap.get(localCand.id);
              apiCandidateMap.delete(localCand.id); // Remove from map so we don't add it twice
              return { ...localCand, ...apiCand };
            }
            return localCand;
          });

          // Add any remaining API candidates that weren't in local storage
          const finalList = [...Array.from(apiCandidateMap.values()), ...mergedList];
          
          setScreenedList(finalList);
          localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(finalList));
        }
      } catch (err) {
        console.error("Error fetching candidates:", err);
      }
    };
    fetchCandidates();
  }, []);

  // Calculate counts for each pipeline stage
  const countAll = screenedList.filter(c => c.status !== 'rejected').length;
  const countAwaiting = screenedList.filter(c => c.status !== 'Interview Pending' && c.status !== 'Interview In Progress' && c.status !== 'Interview Completed' && c.status !== 'rejected').length;
  const countScheduledLive = screenedList.filter(c => c.status === 'Interview Pending' || c.status === 'Interview In Progress').length;
  const countCompleted = screenedList.filter(c => c.status === 'Interview Completed').length;
  const countHired = screenedList.filter(c => c.status === 'shortlisted').length;
  const countRejected = screenedList.filter(c => c.status === 'rejected').length;

  // Filter candidates according to selected sub-tab
  const filteredCandidates = screenedList.filter(cand => {
    if (pipelineSubTab === 'awaiting_invite') {
      return cand.status !== 'Interview Pending' && cand.status !== 'Interview In Progress' && cand.status !== 'Interview Completed' && cand.status !== 'shortlisted' && cand.status !== 'rejected';
    }
    if (pipelineSubTab === 'scheduled_live') {
      return cand.status === 'Interview Pending' || cand.status === 'Interview In Progress';
    }
    if (pipelineSubTab === 'completed') {
      return cand.status === 'Interview Completed';
    }
    if (pipelineSubTab === 'hired') {
      return cand.status === 'shortlisted';
    }
    if (pipelineSubTab === 'rejected') {
      return cand.status === 'rejected';
    }
    return cand.status !== 'rejected';
  });

  const displayedCandidates = filteredCandidates.slice(0, visibleCount);
  const hasMore = filteredCandidates.length > visibleCount;


  const handleUpload = async () => {
    if (!jdFile || !resumeFile) return;

    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem('access');

    try {
      const formData = new FormData();
      formData.append('jd', jdFile);
      formData.append('resume', resumeFile);
      formData.append('candidate_name', 'Extracted Candidate'); 
      formData.append('candidate_email', 'extracted@example.com');

      setMessage({ type: 'info', text: 'Uploading files and starting AI analysis...' });

      const processRes = await fetch(`${API_BASE}/ai/screening/process/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const processContentType = processRes.headers.get("content-type");
      if (!processContentType || !processContentType.includes("application/json")) {
        const text = await processRes.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error(`AI Service Error: Server returned HTML. Check backend logs.`);
      }

      const result = await processRes.json();
      if (!processRes.ok) {
        throw new Error(result.error || 'AI analysis failed');
      }
      
      const localResumeUrl = resumeFile ? URL.createObjectURL(resumeFile) : null;
      
      const newCand = {
        ...result.candidate_details,
        id: Date.now().toString(),
        ats_score: result.candidate_details.ats_score || 0,
        resume_url: result.resume_url,
        local_resume_url: localResumeUrl,
        filename: resumeFile.name,
        job_title: result.job_config?.title || 'Unknown Job',
        screened_at: 'Just Now',
        job_config: result.job_config
      };

      setJobConfig(result.job_config);
      setAnalysisResult(newCand);
      setSelectedCandidate(newCand);

      const updatedList = [newCand, ...screenedList];
      setScreenedList(updatedList);
      const userEmail = localStorage.getItem('email') || 'default';
      localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(updatedList));

      setMessage(null);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = (updatedData) => {
    if (selectedCandidate) {
      const updated = { ...selectedCandidate, ...updatedData };
      setSelectedCandidate(updated);
      
      const updatedList = screenedList.map(c => c.id === selectedCandidate.id ? updated : c);
      setScreenedList(updatedList);
      const userEmail = localStorage.getItem('email') || 'default';
      localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(updatedList));
    }
    if (analysisResult && (!selectedCandidate || selectedCandidate.id === analysisResult.id)) {
      setAnalysisResult(prev => ({ ...prev, ...updatedData }));
    }
  };

  const handleScheduleInterview = (candidate) => {
    if (!candidate) return;
    setDialogOption('5');
    setDialogCustomValue('5');
    setCustomError('');
    setCandidateToConfigure(candidate);
    setIsConfigDialogOpen(true);
  };

  const executeScheduleInterview = async (candidate, questionCount) => {
    if (!candidate) return;
    setSchedulingCandidateId(candidate.id);
    setMessage({ type: 'info', text: `Sending interview invite to ${candidate.name}...` });

    const token = localStorage.getItem('access');
    const defaultConfig = {
      interview_type: 'Technical Interview',
      difficulty: 'Medium',
      duration: '30 mins',
      enable_camera: true,
      enable_microphone: true,
      coding_round: false,
      screen_sharing: false,
      allow_retake: false,
      auto_submit: true
    };

    try {
      const res = await fetch(`${API_BASE}/interviews/invite/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: candidate.email,
          name: candidate.name,
          job_title: candidate.job_title || jobConfig?.title,
          interview_type: defaultConfig.interview_type,
          difficulty: defaultConfig.difficulty,
          duration: defaultConfig.duration,
          config: {
            ...defaultConfig,
            question_count: questionCount
          },
          questionCount: questionCount
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `✅ Interview link sent to ${candidate.email}` });
        
        // Update both list and detail statuses to include the real session_token and real interview_id
        const updatedList = screenedList.map(c => 
          c.id === candidate.id ? { ...c, id: data.interview_id, status: 'Interview Pending', session_token: data.session_token } : c
        );
        setScreenedList(updatedList);
        const userEmail = localStorage.getItem('email') || 'default';
        localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(updatedList));

        if (analysisResult && analysisResult.id === candidate.id) {
          setAnalysisResult(prev => ({ ...prev, id: data.interview_id, status: 'Interview Pending', session_token: data.session_token }));
        }
        if (selectedCandidate && selectedCandidate.id === candidate.id) {
          setSelectedCandidate(prev => ({ ...prev, id: data.interview_id, status: 'Interview Pending', session_token: data.session_token }));
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invite');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSchedulingCandidateId(null);
    }
  };

  const validateCustomCount = (val) => {
    if (!val || String(val).trim() === '') {
      return "Please enter a number of questions";
    }
    const num = Number(val);
    if (!Number.isInteger(num)) {
      return "Number of questions must be an integer";
    }
    if (num < 1) {
      return "Minimum number of questions is 1";
    }
    if (num > 50) {
      return "Maximum number of questions is 50";
    }
    return null;
  };

  const handleConfirmDelete = (cand) => {
    setCandidateToDelete(cand);
  };

  const handlePerformDelete = async (cand) => {
    setCandidateToDelete(null);
    setDeletingId(cand.id);
    
    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE}/interviews/candidate/?email=${encodeURIComponent(cand.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedList = screenedList.filter(c => c.id !== cand.id);
        setScreenedList(updatedList);
        const userEmail = localStorage.getItem('email') || 'default';
        localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(updatedList));
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

  return (
    <div className="space-y-6">
      {/* Page Title & Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Jobs & Candidates</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1">Screen resumes and manage candidates in your pipeline</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('screen')}
            className={`flex-1 sm:flex-none justify-center px-4 py-2 text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'screen'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload & Screen
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 sm:flex-none justify-center px-4 py-2 text-xs md:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Screened Pipeline ({screenedList.length})
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold animate-in fade-in duration-300 flex items-center justify-between gap-4 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          <span>{message.text}</span>
          {message.type === 'success' && activeTab === 'screen' && (
            <button 
              onClick={() => setActiveTab('pipeline')}
              className="text-xs font-bold underline hover:no-underline cursor-pointer"
            >
              View in Pipeline →
            </button>
          )}
        </div>
      )}

      {activeTab === 'screen' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Description Card */}
            {loading ? (
              <LoadingCard type="jd" />
            ) : jdFile ? (
              <SelectedCard
                file={jdFile}
                type="jd"
                onRemove={() => {
                  setJdFile(null);
                  setAnalysisResult(null);
                }}
                onReplace={(file) => {
                  setJdFile(file);
                  setAnalysisResult(null);
                }}
                onPreview={() => {
                  setPreviewFile({
                    name: jdFile.name,
                    type: 'jd',
                    url: URL.createObjectURL(jdFile)
                  });
                }}
                disabled={loading}
              />
            ) : (
              <EmptyCard
                icon="description"
                title="Upload Job Description"
                description="PDF, DOCX, or text content"
                onFileSelect={setJdFile}
                disabled={loading}
              />
            )}

            {/* Candidate Resume Card */}
            {loading ? (
              <LoadingCard type="resume" />
            ) : resumeFile ? (
              <SelectedCard
                file={resumeFile}
                type="resume"
                onRemove={() => {
                  setResumeFile(null);
                  setAnalysisResult(null);
                }}
                onReplace={(file) => {
                  setResumeFile(file);
                  setAnalysisResult(null);
                }}
                onPreview={() => {
                  setPreviewFile({
                    name: resumeFile.name,
                    type: 'resume',
                    url: URL.createObjectURL(resumeFile)
                  });
                }}
                disabled={loading}
              />
            ) : (
              <EmptyCard
                icon="upload_file"
                title="Upload Candidate Resume"
                description="PDF or DOCX supported"
                onFileSelect={setResumeFile}
                disabled={loading}
              />
            )}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={!jdFile || !resumeFile || loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyzing...
                </>
              ) : 'Start Screening'}
            </button>
          </div>

          {/* Job Details Section */}
          <section className={jobConfig ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-uppercase text-slate-500 uppercase tracking-widest text-[11px]">Active Job Configuration</h3>
              {jobConfig && (
                <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Details
                </button>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
              {jobConfig ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                        <span className="material-symbols-outlined text-2xl md:text-3xl">work</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight break-words">{jobConfig.title}</h4>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{jobConfig.department} • Full-time • Remote</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg self-start shrink-0">
                      <span className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest">EXTRACTED</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">REQUIRED SKILLS & STACK</p>
                    <div className="flex flex-wrap gap-2">
                      {jobConfig.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">info</span>
                  <p>Upload a JD to see configuration</p>
                </div>
              )}
            </div>
          </section>

          {/* Analysis Result */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Analysis Result</h3>
              {analysisResult && <span className="text-xs text-gray-400">Processed Just Now</span>}
            </div>
            
            {analysisResult ? (
              <CandidateCard 
                candidate={analysisResult} 
                jobTitle={analysisResult.job_title} 
                onViewFullReport={() => {
                  setSelectedCandidate(analysisResult);
                  setShowDeepView(true);
                }}
                onUpdateCandidate={handleUpdateCandidate}
                onSchedule={() => handleScheduleInterview(analysisResult)}
                isScheduling={schedulingCandidateId === analysisResult.id}
              />
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                <p>Upload files and click "Start Screening" to analyze candidate match.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Screened Candidates Pipeline List */
        <section className="space-y-4 pt-1 sm:pt-2 animate-in fade-in duration-300">

          {/* Workflow Stage Sub-Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-none gap-1">
            <button
              onClick={() => setPipelineSubTab('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              All Screened
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countAll}
              </span>
            </button>
            <button
              onClick={() => setPipelineSubTab('awaiting_invite')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'awaiting_invite'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              Awaiting Invite
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'awaiting_invite' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countAwaiting}
              </span>
            </button>
            <button
              onClick={() => setPipelineSubTab('scheduled_live')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'scheduled_live'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              Scheduled / Live
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'scheduled_live' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countScheduledLive}
              </span>
            </button>
            <button
              onClick={() => setPipelineSubTab('completed')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'completed'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              Completed
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countCompleted}
              </span>
            </button>
            <button
              onClick={() => setPipelineSubTab('hired')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'hired'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-emerald-700'
              }`}
            >
              Hired
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'hired' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countHired}
              </span>
            </button>
            <button
              onClick={() => setPipelineSubTab('rejected')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                pipelineSubTab === 'rejected'
                  ? 'bg-white text-red-650 shadow-sm border border-slate-100'
                  : 'text-gray-500 hover:text-red-650'
              }`}
            >
              Rejected
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${pipelineSubTab === 'rejected' ? 'bg-red-50 text-red-650' : 'bg-gray-200/60 text-gray-500'}`}>
                {countRejected}
              </span>
            </button>
          </div>

          {filteredCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
              {displayedCandidates.map((cand) => (
                <div 
                  key={cand.id} 
                  className={`bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group duration-300 ${
                    deletingId === cand.id ? 'opacity-0 scale-95 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
                  }`}
                  onClick={() => {
                    setSelectedCandidate(cand);
                    setShowDeepView(true);
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                           {cand.name ? cand.name.split(' ').map(n => n[0]).join('') : 'C'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-gray-950 group-hover:text-blue-600 transition-colors leading-tight truncate">
                            {cand.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{cand.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {cand.ats_score || cand.score}% Match
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 mt-1">{cand.screened_at || 'Just Now'}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelete(cand);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Remove Candidate"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-50">
                      <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Applying For</div>
                      <div className="text-xs font-bold text-gray-700">{cand.job_title || 'Unknown Job'}</div>
                    </div>

                    {cand.highlights && cand.highlights.length > 0 && (
                      <div className="mt-2.5">
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Key Highlights</div>
                        <div className="flex flex-wrap gap-1">
                          {cand.highlights.slice(0, 3).map((h, idx) => (
                            <span key={idx} className="text-[9px] sm:text-[10px] bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    {cand.status === 'Interview Pending' ? (
                      <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                        Invite Sent
                      </span>
                    ) : cand.status === 'Interview In Progress' ? (
                      <span className="text-xs font-extrabold text-blue-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-blue-500 animate-spin">sync</span>
                        In Progress
                      </span>
                    ) : cand.status === 'Interview Completed' ? (
                      <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-indigo-500">task_alt</span>
                        Completed
                      </span>
                    ) : cand.status === 'shortlisted' ? (
                      <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
                        Hired
                      </span>
                    ) : cand.status === 'rejected' ? (
                      <span className="text-xs font-extrabold text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-red-500">cancel</span>
                        Rejected
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleInterview(cand);
                        }}
                        disabled={schedulingCandidateId === cand.id}
                        className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-75"
                      >
                        {schedulingCandidateId === cand.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            Sending Invite...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                            Schedule Interview
                          </>
                        )}
                      </button>
                    )}
                    <span className="text-xs text-gray-400 font-semibold group-hover:translate-x-1 transition-all flex items-center gap-0.5">
                      View Details
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </span>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div 
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="bg-slate-50/50 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 hover:shadow-md transition-all cursor-pointer rounded-2xl p-6 flex flex-col items-center justify-center text-center group h-full min-h-[200px] duration-300"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">more_horiz</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Show {filteredCandidates.length - visibleCount} More Candidates
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Viewing {visibleCount} of {filteredCandidates.length} in this stage
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-3 text-gray-300">
                {pipelineSubTab === 'rejected' ? 'person_remove' : 'group_off'}
              </span>
              <p className="text-sm font-semibold">No candidates in this stage of the pipeline</p>
            </div>
          )}
        </section>
      )}

      <CandidateDeepView 
        isOpen={showDeepView}
        onClose={() => {
          setShowDeepView(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate} 
        jobConfig={selectedCandidate?.job_config || jobConfig}
        onUpdateCandidate={handleUpdateCandidate}
        onSchedule={() => handleScheduleInterview(selectedCandidate)}
        isScheduling={schedulingCandidateId === selectedCandidate?.id}
        onReject={() => {
           setShowDeepView(false);
           const updatedList = screenedList.map(c => 
             c.id === selectedCandidate.id ? { ...c, status: 'rejected' } : c
           );
           setScreenedList(updatedList);
           const userEmail = localStorage.getItem('email') || 'default';
           localStorage.setItem(`screened_candidates_${userEmail}`, JSON.stringify(updatedList));
           setSelectedCandidate(null);
           setMessage({ type: 'info', text: 'Candidate status updated to Rejected.' });
        }}
      />

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {previewFile.type === 'jd' ? 'description' : 'picture_as_pdf'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm truncate max-w-xs md:max-w-md">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">File Preview</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
              {previewFile.url ? (
                <iframe 
                  src={previewFile.url} 
                  className="w-full h-full rounded-lg border border-slate-200 shadow-sm"
                  title="Document Preview"
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <span className="material-symbols-outlined text-5xl mb-2">find_in_page</span>
                  <p className="text-sm font-semibold">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
              Remove this candidate from the pipeline?
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
      {/* INTERVIEW CONFIGURATION DIALOG */}
      {isConfigDialogOpen && candidateToConfigure && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">settings_suggest</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-950">Configure Interview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">For {candidateToConfigure.name}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsConfigDialogOpen(false);
                  setCandidateToConfigure(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 my-6">
              <div>
                <label htmlFor="question-count-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Number of Questions
                </label>
                <div className="relative">
                  <select
                    id="question-count-select"
                    value={dialogOption}
                    onChange={(e) => {
                      setDialogOption(e.target.value);
                      setCustomError("");
                    }}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3.5 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="5">5 Questions (Default)</option>
                    <option value="10">10 Questions</option>
                    <option value="15">15 Questions</option>
                    <option value="20">20 Questions</option>
                    <option value="custom">Custom</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>

              {dialogOption === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label htmlFor="custom-question-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Enter Number of Questions
                  </label>
                  <input
                    id="custom-question-input"
                    type="number"
                    value={dialogCustomValue}
                    onChange={(e) => {
                      setDialogCustomValue(e.target.value);
                      setCustomError("");
                    }}
                    min="1"
                    max="50"
                    placeholder="e.g. 12"
                    className={`w-full bg-gray-50 border ${customError ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} text-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition-all`}
                  />
                  {customError && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {customError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsConfigDialogOpen(false);
                  setCandidateToConfigure(null);
                }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  let finalCount = 5;
                  if (dialogOption === 'custom') {
                    const error = validateCustomCount(dialogCustomValue);
                    if (error) {
                      setCustomError(error);
                      return;
                    }
                    finalCount = parseInt(dialogCustomValue, 10);
                  } else {
                    finalCount = parseInt(dialogOption, 10);
                  }
                  
                  // Store in state
                  setQuestionCountState({ questionCount: finalCount });
                  
                  // Trigger schedule
                  const cand = candidateToConfigure;
                  setIsConfigDialogOpen(false);
                  setCandidateToConfigure(null);
                  executeScheduleInterview(cand, finalCount);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-100 transition-colors cursor-pointer"
              >
                Send Interview Invite
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
