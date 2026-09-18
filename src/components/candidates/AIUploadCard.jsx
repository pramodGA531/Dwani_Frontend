import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ==========================================
// 1. EMPTY STATE CARD
// ==========================================
export function EmptyCard({ icon, title, description, onFileSelect, disabled }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  return (
    <Card 
      className={`bg-white border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center border-dashed border-2 bg-slate-50/30 group transition-all duration-300 min-h-[180px] sm:min-h-[240px] ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-blue-400 hover:bg-blue-50/5 cursor-pointer hover:shadow-md'
      }`}
      onClick={handleClick}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx"
        disabled={disabled}
      />
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-3 sm:mb-4 group-hover:text-blue-600 group-hover:border-blue-100 transition-all duration-300 shrink-0">
        <span className="material-symbols-outlined text-slate-500 group-hover:text-blue-600 transition-colors text-[20px] sm:text-[24px]">
          {icon}
        </span>
      </div>
      <h3 className="font-bold text-slate-800 mb-0.5 sm:mb-1 text-xs sm:text-sm">{title}</h3>
      <p className="text-[11px] sm:text-xs text-slate-500 text-center mb-3 sm:mb-4">{description}</p>
      <Button 
        variant="outline" 
        disabled={disabled}
        className="bg-white border-slate-200 hover:bg-slate-50 font-bold h-8 sm:h-9 px-3 sm:px-4 rounded-xl cursor-pointer text-xs sm:text-sm"
      >
        Choose File
      </Button>
    </Card>
  );
}

// ==========================================
// 1.5 SELECTED (READY TO SCREEN) STATE CARD
// ==========================================
export function SelectedCard({ file, type, onRemove, onReplace, onPreview, disabled }) {
  const fileInputRef = useRef(null);

  const handleReplaceClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onReplace) {
      onReplace(file);
    }
    e.target.value = '';
  };

  return (
    <Card className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center min-h-[180px] sm:min-h-[240px] bg-blue-50/5 group hover:border-blue-400 transition-all duration-300">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx"
        disabled={disabled}
      />
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2.5 sm:mb-3 shadow-sm border border-blue-100 shrink-0">
        <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
          {type === 'jd' ? 'article' : 'badge'}
        </span>
      </div>
      <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-xs text-center mb-0.5 sm:mb-1 px-2">
        {file.name}
      </h3>
      <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 mb-3 sm:mb-4 uppercase tracking-wider inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        Ready to Screen
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        {onPreview && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            disabled={disabled}
            className="border-slate-200 text-blue-600 hover:bg-blue-50 font-bold h-8 sm:h-9 px-3 sm:px-4 rounded-xl cursor-pointer text-xs"
          >
            Preview
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReplaceClick}
          disabled={disabled}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-8 sm:h-9 px-3 sm:px-4 rounded-xl cursor-pointer text-xs"
        >
          Replace
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={disabled}
          className="border-red-100 text-red-600 hover:bg-red-50 font-bold h-8 sm:h-9 px-3 sm:px-4 rounded-xl cursor-pointer text-xs"
        >
          Remove
        </Button>
      </div>
    </Card>
  );
}

// ==========================================
// 2. LOADING / AI PROCESSING CARD
// ==========================================
export function LoadingCard({ type }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(10);

  const jdSteps = [
    "Analyzing Job Description...",
    "Extracting required skills...",
    "Preparing AI configuration..."
  ];

  const resumeSteps = [
    "Parsing Candidate Resume...",
    "Extracting candidate email...",
    "Matching candidate skills..."
  ];

  const steps = type === 'jd' ? jdSteps : resumeSteps;

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col items-center justify-center min-h-[180px] sm:min-h-[240px] relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 -z-10" />

      {/* Animated Spinner Ring */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 shrink-0">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
        <div className="absolute inset-1.5 sm:inset-2 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
          <span className="material-symbols-outlined text-blue-600 animate-pulse text-[18px] sm:text-[22px]">
            {type === 'jd' ? 'description' : 'psychology'}
          </span>
        </div>
      </div>

      {/* Dynamic Progress Text */}
      <div className="text-center space-y-2.5 sm:space-y-3 w-full max-w-[240px]">
        <div className="space-y-0.5 sm:space-y-1">
          <h4 className="font-bold text-xs sm:text-sm text-slate-800 transition-all duration-300">
            {steps[step]}
          </h4>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            AI Processing {progress}%
          </span>
        </div>
        
        {/* Skeleton pulse bar */}
        <div className="space-y-1 py-0.5">
          <div className="h-1 bg-slate-100 rounded-full w-4/5 mx-auto animate-pulse" />
          <div className="h-1 bg-slate-100 rounded-full w-3/5 mx-auto animate-pulse" />
        </div>
        
        {/* Loading Progress Bar */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 3. JOB DESCRIPTION SUCCESS CARD
// ==========================================
export function JDSuccessCard({ file, skills = [], onReplace, onRemove, onPreview }) {
  const fileInputRef = useRef(null);

  const handleReplaceClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onReplace) {
      onReplace(file);
    }
    e.target.value = '';
  };

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between min-h-[180px] sm:min-h-[240px] relative overflow-hidden transition-all duration-300 hover:shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx"
      />
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">description</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={file?.name || "Job Description"}>
                {file?.name || "Job_Description.pdf"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">check_circle</span>
                Successfully analyzed
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold shrink-0">
            Just Now
          </span>
        </div>

        {/* Extracted Skills */}
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Skills extracted:
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {skills.length > 0 ? (
              skills.slice(0, 4).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No skills identified</span>
            )}
            {skills.length > 4 && (
              <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-[9px] sm:text-[10px] font-bold self-center">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-3.5 pt-3 sm:mt-4 sm:pt-4 border-t border-slate-100">
        <button 
          onClick={onPreview}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">visibility</span>
          Preview
        </button>
        <button 
          onClick={handleReplaceClick}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">cached</span>
          Replace File
        </button>
        <button 
          onClick={onRemove}
          className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">delete</span>
          Remove
        </button>
      </div>
    </Card>
  );
}

// ==========================================
// 4. CANDIDATE RESUME SUCCESS CARD
// ==========================================
export function ResumeSuccessCard({ 
  file, 
  candidateName, 
  email, 
  atsScore, 
  onPreview, 
  onUpdateEmail, 
  onReplace, 
  onRemove 
}) {
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmail, setTempEmail] = useState(email || "");
  const [emailError, setEmailError] = useState("");

  const handleReplaceClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onReplace) {
      onReplace(file);
    }
    e.target.value = '';
  };

  const handleSaveEmail = (e) => {
    e.stopPropagation();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempEmail)) {
      setEmailError("Invalid email address");
      return;
    }
    setEmailError("");
    if (onUpdateEmail) {
      onUpdateEmail(tempEmail);
    }
    setIsEditing(false);
  };

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between min-h-[180px] sm:min-h-[240px] relative overflow-hidden transition-all duration-300 hover:shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx"
      />
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm text-xs sm:text-sm">
              {candidateName ? candidateName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() : "C"}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={file?.name || "Resume"}>
                {file?.name || "Resume.pdf"}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">check_circle</span>
                Resume parsed successfully
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold shrink-0">
            Just Now
          </span>
        </div>

        {/* Email & Match Score */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Edit Email:
              </p>
              <div className="flex gap-1.5">
                <Input
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`h-7 text-xs px-2 py-1 bg-white border border-gray-200 focus:ring-blue-500 ${emailError ? "border-red-500" : ""}`}
                  autoFocus
                />
                <button
                  onClick={handleSaveEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2 text-[10px] font-bold cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEmailError(""); }}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg px-2 text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              {emailError && (
                <p className="text-[9px] text-red-500 font-bold">{emailError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 sm:p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Email Extracted:
                </p>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {email || "extracted@example.com"}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg border border-emerald-100 shadow-sm">
                <span className="text-xs font-black">{atsScore || 0}%</span>
                <span className="text-[8px] font-bold uppercase tracking-wide">Match</span>
              </div>
            </div>
          )}
          
          <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[13px] sm:text-[14px]">auto_awesome</span>
            Candidate matched with JD
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 mt-3.5 pt-3 sm:mt-4 sm:pt-4 border-t border-slate-100">
        <button 
          onClick={onPreview}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">visibility</span>
          Preview Resume
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTempEmail(email || ""); }}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">edit</span>
          Edit Email
        </button>
        <button 
          onClick={handleReplaceClick}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">cached</span>
          Replace
        </button>
        <button 
          onClick={onRemove}
          className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">delete</span>
          Remove
        </button>
      </div>
    </Card>
  );
}
