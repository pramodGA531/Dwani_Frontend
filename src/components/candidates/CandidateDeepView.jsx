import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CandidateDeepView({
  isOpen,
  onClose,
  candidate,
  jobConfig,
  onSchedule,
  onReject,
  onUpdateCandidate,
  isScheduling,
}) {
  const status = candidate?.status || "Awaiting Review";
  const scheduled = status === "Interview Pending";
  const navigate = useNavigate();

  // Email Editing State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

  if (!isOpen || !candidate) return null;

  const {
    name = "Candidate Name",
    email = "email@example.com",
    phone = "+1 (555) 000-0000",
    ats_score = 0,
    skills = [],
    resume_url = "",
  } = candidate;

  // Helper to determine the best preview URL based on file type
  const getPreviewUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:')) return `${url}#toolbar=0`;
    
    // If it's a PDF, allow the browser to render it natively
    if (url.toLowerCase().includes('.pdf')) {
      return `${url}#toolbar=0`;
    }
    
    // Force Google Docs viewer for DOCX or other formats to prevent auto-downloads in the iframe.
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleStartEdit = () => {
    setEditedEmail(email);
    setIsEditingEmail(true);
    setEmailError("");
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setEmailError("");
  };

  const handleSaveEmail = async () => {
    if (!validateEmail(editedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSavingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (onUpdateCandidate) {
        onUpdateCandidate({ email: editedEmail });
      }
      setIsEditingEmail(false);
    } catch {
      setEmailError("Failed to save. Try again.");
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Dynamic data for experience and education from the backend, fallback to empty arrays if not present
  const experience = candidate.experience || [];
  const education = candidate.education || [];

  const statusOptions = [
    {
      label: "Suitable",
      value: "Suitable",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: "check_circle",
    },
    {
      label: "Awaiting Review",
      value: "Awaiting Review",
      color: "bg-blue-50 text-blue-700 border-blue-100",
      icon: "visibility",
    },
    {
      label: "Shortlisted",
      value: "Shortlisted",
      color: "bg-amber-50 text-amber-700 border-amber-100",
      icon: "star",
    },
    {
      label: "Interview Pending",
      value: "Interview Pending",
      color: "bg-purple-50 text-purple-700 border-purple-100",
      icon: "schedule",
    },
    {
      label: "Not Suitable",
      value: "Not Suitable",
      color: "bg-red-50 text-red-700 border-red-100",
      icon: "cancel",
    },
  ];

  const currentStatus =
    statusOptions.find((opt) => opt.value === status) || statusOptions[1];

  const explanation = candidate.jd_match_explanation || "No explanation provided.";
  const isLongExplanation = explanation.length > 250;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-50 w-full h-full md:h-[95vh] max-w-7xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Candidate Pre-Screening Profile
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-6">
          
          {/* Full-Width Candidate Profile Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            
            {/* Left Side: Avatar & Candidate Info */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 flex-1 min-w-0 w-full">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-blue-100 border-4 border-white shrink-0">
                {name ? name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase() : "C"}
              </div>

              {/* Text Info */}
              <div className="space-y-2 flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words min-w-0">
                    {name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1.5 shrink-0 ${currentStatus.color}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {currentStatus.label}
                  </span>
                </div>

                {/* Applied Role & Contact Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-sm text-gray-500 w-full mt-2">
                  <div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md text-xs font-semibold shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      work
                    </span>
                    <span>{jobConfig?.title || "Applied Role"}</span>
                  </div>

                  {/* Email Editing Form or Static display */}
                  <div className="min-w-0">
                    {isEditingEmail ? (
                      <div className="space-y-2 w-full max-w-sm">
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <Input
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            placeholder="Candidate Email"
                            className={`h-9 text-sm px-3 py-2 rounded-lg border-gray-200 focus:ring-blue-500 w-full ${emailError ? "border-red-500" : ""}`}
                            autoFocus
                          />
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={handleSaveEmail}
                              disabled={isSavingEmail}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-9 font-bold flex-1 sm:flex-none"
                            >
                              {isSavingEmail ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="border-gray-200 text-gray-600 h-9 px-4 font-bold flex-1 sm:flex-none"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                        {emailError && (
                          <p className="text-[11px] text-red-500 font-bold">
                            {emailError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 group cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={handleStartEdit}
                      >
                        <span className="material-symbols-outlined text-gray-400 text-[18px] shrink-0">
                          mail
                        </span>
                        <span className="break-all">{email}</span>
                        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all shrink-0">
                          edit
                        </span>
                      </div>
                    )}
                  </div>

                  {!isEditingEmail && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="material-symbols-outlined text-gray-400 text-[18px] shrink-0">
                        call
                      </span>
                      <span className="break-words">{phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Side: Match Score */}
            <div className="flex flex-col items-center justify-center gap-2 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-dashed lg:border-solid border-gray-100 lg:mx-6 lg:px-8 shrink-0 w-full lg:w-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                JD Match Score
              </span>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - ats_score / 100)}`}
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {ats_score}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">
                    High Match
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 w-full lg:w-64 xl:w-80 shrink-0">
              <Button
                onClick={() => navigate(`/live-monitoring/${candidate.session_token || candidate.id}`, { state: { candidate } })}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 px-3 text-xs sm:col-span-2 lg:col-span-1 xl:col-span-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>
                Monitor Live Session
              </Button>
              {candidate.session_token && (
                <Button
                  onClick={() => {
                    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '').replace(':8000', ':5173') || 'http://192.168.0.114:5173';
                    const link = `${frontendUrl}/interview/${candidate.session_token}`;
                    navigator.clipboard.writeText(link);
                    alert("Interview link copied to clipboard:\n" + link);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 px-3 text-xs sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    content_copy
                  </span>
                  Copy Session Link
                </Button>
              )}
              <Button
                onClick={onSchedule}
                disabled={scheduled || isScheduling}
                className={`w-full font-bold h-9 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all px-3 text-xs ${
                  scheduled 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                }`}
              >
                {isScheduling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Sending Invite...
                  </>
                ) : scheduled ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Invite Sent
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    Schedule Interview
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(resume_url, "_blank")}
                className="w-full border-gray-200 text-gray-700 font-bold h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 px-3 text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Download Resume
              </Button>
              <Button
                variant="outline"
                onClick={onReject}
                className="w-full border-red-100 text-red-600 font-bold h-9 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 px-3 text-xs sm:col-span-2 lg:col-span-1 xl:col-span-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_remove
                </span>
                Reject Candidate
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Resume Preview & AI Summary */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Resume Preview */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[400px] md:h-[550px] lg:h-[650px] relative">
                {/* Sticky Section Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-gray-400">
                      description
                    </span>
                    Resume Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const preview = resume_url || candidate.local_resume_url;
                        if (preview) window.open(preview, "_blank");
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                      title="Open in new tab"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        open_in_new
                      </span>
                    </button>
                  </div>
                </div>

                {/* Iframe Preview Container */}
                <div className="flex-1 bg-slate-50/50 p-2 sm:p-4 md:p-6 flex justify-center overflow-hidden">
                  {resume_url || candidate.local_resume_url ? (
                    <iframe
                      src={getPreviewUrl(resume_url || candidate.local_resume_url)}
                      className="w-full h-full rounded-xl border border-gray-100 shadow-sm max-w-4xl bg-white"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                      <span className="material-symbols-outlined text-5xl mb-2">
                        find_in_page
                      </span>
                      <p className="text-sm">Resume preview not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Screening Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 md:p-6 shadow-sm space-y-4 sm:space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-indigo-900">
                    auto_awesome
                  </span>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                      <span className="material-symbols-outlined text-[18px]">
                        auto_awesome
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      AI Screening Summary
                    </h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shrink-0">
                    Confidence: High
                  </div>
                </div>

                <div className="space-y-2 relative z-10">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                    JD Match Explanation
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isLongExplanation && !isExplanationExpanded
                      ? `${explanation.slice(0, 250)}...`
                      : explanation}
                    {isLongExplanation && (
                      <button
                        onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                        className="ml-2 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        {isExplanationExpanded ? "Show Less" : "Read More"}
                        <span className="material-symbols-outlined text-[14px]">
                          {isExplanationExpanded ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10 mt-2">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-750">
                      <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0">
                        check_circle
                      </span>
                      <span className="font-bold text-[11px] uppercase tracking-wider">
                        Strengths
                      </span>
                    </div>
                    <ul className="space-y-1.5 ml-7">
                      {(candidate.strengths || []).map((strength, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                          <span>{strength}</span>
                        </li>
                      ))}
                      {(!candidate.strengths || candidate.strengths.length === 0) && (
                        <li className="text-xs text-gray-500 italic">No strengths identified</li>
                      )}
                    </ul>
                  </div>

                  {/* Concerns */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-755">
                      <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">
                        warning
                      </span>
                      <span className="font-bold text-[11px] uppercase tracking-wider">
                        Potential Concerns
                      </span>
                    </div>
                    <ul className="space-y-1.5 ml-7">
                      {(candidate.concerns || []).map((concern, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                          <span>{concern}</span>
                        </li>
                      ))}
                      {(!candidate.concerns || candidate.concerns.length === 0) && (
                        <li className="text-xs text-gray-500 italic">No concerns identified</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Skills, Experience, Education */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Technical Skills */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">
                    psychology
                  </span>
                  Technical Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-750 rounded-lg text-xs font-semibold border border-slate-100 hover:border-blue-200 transition-all duration-200 cursor-default shadow-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">
                      No skills identified
                    </p>
                  )}
                </div>
              </div>

              {/* Experience Section */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">
                    history_edu
                  </span>
                  Experience
                </h3>
                <div className="space-y-6">
                  {experience.length > 0 ? experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="relative pl-6 pb-6 last:pb-0 group"
                    >
                      {idx !== experience.length - 1 && (
                        <div className="absolute left-[3px] top-4 bottom-0 w-px bg-gray-100 group-hover:bg-blue-100 transition-colors"></div>
                      )}
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 shadow-sm transition-transform group-hover:scale-110"></div>
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                          <h4 className="text-sm font-bold text-gray-900 leading-tight">
                            {exp.role}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap bg-gray-100/60 px-2 py-0.5 rounded shrink-0 self-start">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-blue-600">
                          {exp.company}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400">No experience identified</p>
                  )}
                </div>
              </div>

              {/* Education Section */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">
                    school
                  </span>
                  Education
                </h3>
                <div className="space-y-4">
                  {education.length > 0 ? education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                          {edu.degree}
                        </h4>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0 bg-white px-2 py-0.5 rounded border border-gray-100">
                          {edu.year}
                        </span>
                      </div>
                      
                      {edu.specialization && (
                        <p className="text-[11px] font-semibold text-blue-600">
                          {edu.specialization}
                        </p>
                      )}

                      <p className="text-[11px] font-medium text-gray-600">
                        {edu.school || edu.institution}
                      </p>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400">No education identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
