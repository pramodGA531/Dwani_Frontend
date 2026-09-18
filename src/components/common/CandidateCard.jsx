import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CandidateCard({ candidate, onViewFullReport, onUpdateCandidate, onSchedule, isScheduling }) {
  const scheduled = candidate?.status === 'Interview Pending';
  
  // Email Editing State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  if (!candidate) return null;

  const {
    name = "Pending Analysis",
    email = "Not available",
    ats_score = 0,
    highlights = [],
    filename = "resume.pdf"
  } = candidate;

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
      // Simulate API call for now since we don't have a direct update endpoint
      await new Promise(resolve => setTimeout(resolve, 600));
      
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


  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-3.5 sm:p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg sm:text-xl border border-blue-200 shadow-sm shrink-0">
                {name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm text-white">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight truncate">{name}</h4>
              
              {isEditingEmail ? (
                <div className="mt-1.5 space-y-2 max-w-sm">
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <Input 
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Candidate Email"
                      className={`h-8 sm:h-9 text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border-gray-200 focus:ring-blue-500 ${emailError ? 'border-red-500' : ''}`}
                      autoFocus
                    />
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        size="sm" 
                        onClick={handleSaveEmail}
                        disabled={isSavingEmail}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 h-8 sm:h-9 font-bold text-xs"
                      >
                        {isSavingEmail ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Save'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                        className="border-gray-200 text-gray-600 h-8 sm:h-9 px-3 sm:px-4 font-bold text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  {emailError && <p className="text-[10px] sm:text-[11px] text-red-500 font-bold">{emailError}</p>}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1 group">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px]">mail</span>
                  <span className="truncate max-w-[150px] sm:max-w-none">{email}</span>
                  <button 
                    onClick={handleStartEdit}
                    className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all text-gray-400 hover:text-blue-500"
                    title="Edit Email"
                  >
                    <span className="material-symbols-outlined text-[14px] sm:text-[16px]">edit</span>
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8 bg-gray-50/50 p-3 sm:p-4 rounded-xl lg:bg-transparent lg:p-0">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Status</p>
              <div className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></span>
                {scheduled ? 'Scheduled' : 'Analyzed'}
              </div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Match</p>
              <div className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${ats_score >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                {ats_score >= 80 ? 'EXCELLENT' : ats_score >= 60 ? 'SUITABLE' : 'POTENTIAL'}
              </div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Workflow</p>
              <div className="text-xs sm:text-sm font-semibold text-gray-700">{scheduled ? 'Invited' : 'Ready'}</div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Score</p>
              <div className="text-xs sm:text-sm font-bold text-blue-600">{ats_score}/100</div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-gray-50/50 p-3.5 sm:p-4 rounded-xl border border-gray-100">
            <h5 className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Key Highlights</h5>
            <ul className="space-y-1.5 sm:space-y-2">
              {highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700">
                  <span className="material-symbols-outlined text-emerald-500 text-[16px] sm:text-[18px]">verified</span>
                  <span>{highlight}</span>
                </li>
              ))}
              {highlights.length === 0 && <li className="text-xs text-gray-400">No highlights extracted</li>}
            </ul>
          </div>
          <div className="bg-gray-50/50 p-3.5 sm:p-4 rounded-xl border border-gray-100">
            <h5 className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 sm:mb-3">Next Step</h5>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {scheduled 
                ? "Interview scheduled! The candidate has received a unique session link valid for 24 hours."
                : "Review the full report and schedule a technical screening interview."
              }
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:gap-3">
            <button 
              onClick={onViewFullReport}
              className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              View Full AI Report
            </button>
             <button 
              onClick={onSchedule}
              disabled={scheduled || isScheduling}
              className={`w-full py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                scheduled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isScheduling ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></span>
                  Sending Invite...
                </>
              ) : scheduled ? (
                <>
                  <span className="material-symbols-outlined text-xs sm:text-sm">check_circle</span>
                  Invite Sent
                </>
              ) : 'Schedule Interview'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-4 sm:px-6 py-2.5 sm:py-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">attachment</span>
          {filename}
        </span>
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">REAL-TIME ANALYSIS</span>
      </div>
    </div>
  );
}
