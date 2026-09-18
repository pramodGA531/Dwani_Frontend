import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AlertCircle } from 'lucide-react';

const SessionHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

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

          // Clear any stale session data first
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('interview_id');

          // Store the JWT token for authenticated requests
          localStorage.setItem('token', response.data.access_token);
          
          // Store interview details for the UI to use
          localStorage.setItem('interview_id', response.data.interview_id);
          localStorage.setItem('candidate_name', response.data.candidate_name);
          localStorage.setItem('job_title', response.data.job_title);
          localStorage.setItem('recruiter_name', response.data.recruiter_name);
          localStorage.setItem('interview_session_token', token); // Optional tracking
          
          // Redirect to the beginning of the interview flow
          navigate('/system-check', { replace: true });
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
