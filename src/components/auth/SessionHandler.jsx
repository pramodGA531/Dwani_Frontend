import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AlertCircle } from 'lucide-react';
import { saveInterviewSession } from '../../utils/interviewSession';

const SessionHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [interviewState, setInterviewState] = useState(null);

  useEffect(() => {
    const validateSession = async () => {
      if (!token) {
        setError("No session token provided.");
        return;
      }

      try {
        const isRefresh = sessionStorage.getItem(`active_session_${token}`) === 'true';
        const response = await api.get(`/v1/interviews/validate-session/${token}/?is_refresh=${isRefresh}`);
        
        if (response.data.valid) {
          // Mark this specific browser tab as the active session tab
          sessionStorage.setItem(`active_session_${token}`, 'true');

          // Store the JWT access token for authenticated requests (e.g. api.js interceptor)
          localStorage.setItem('access', response.data.access_token);
          
          const state = {
            interview_id: response.data.interview_id,
            candidate_name: response.data.candidate_name,
            job_title: response.data.job_title,
            recruiter_name: response.data.recruiter_name,
            interview_session_token: token
          };

          saveInterviewSession(state);
          setInterviewState(state);
          setIsValidated(true);
        } else {
          setError("This session link is invalid or has expired.");
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError("Failed to validate session. Please try again later.");
        }
      }
    };

    validateSession();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-red-200 shadow-xl shadow-red-100 rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Invalid Session</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {error}
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
            Please contact your recruiter for a new invitation link.
          </p>
        </div>
      </div>
    );
  }

  if (isValidated && interviewState) {
    const handleStart = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      navigate('/system-check', { replace: true, state: interviewState });
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
        <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Session Verified</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
            Hi {interviewState.candidate_name}, you are scheduled for the <strong className="text-slate-900">{interviewState.job_title}</strong> role.
            <br/><br/>
            Your interview is ready to begin. The assessment will be conducted in full-screen mode.
          </p>
          <button 
            onClick={handleStart}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-95 text-lg"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-500 font-bold tracking-wide uppercase text-sm animate-pulse">
          Validating Session...
        </div>
      </div>
    </div>
  );
};

export default SessionHandler;
