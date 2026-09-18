import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
const MOCK_SESSION_START = Date.now() + 30 * 1000; // 30 seconds from now

const WaitingRoom = () => {
  const navigate = useNavigate();
  const { startInterview } = useInterview();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Retrieve dynamic data from localStorage
  const jobTitle = localStorage.getItem('job_title') || 'Software Engineer';
  const interviewId = localStorage.getItem('interview_id') || 'IV-000-000';
  const recruiterName = localStorage.getItem('recruiter_name') || 'Recruiter';
  const displayInitials = recruiterName.substring(0, 2).toUpperCase();

  const handleJoin = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch(e) {
      console.warn("Fullscreen request denied or not supported.", e);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (startInterview) await startInterview();
    navigate('/interview');
  };

  useEffect(() => {
    const init = async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = ms;
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;
      } catch (err) { console.error(err); }
    };
    init();

    // Calculate initial countdown
    const calculateRemaining = () => {
      const now = new Date();
      const diff = Math.floor((MOCK_SESSION_START - now) / 1000);
      return diff > 0 ? diff : 0;
    };

    setCountdown(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setReady(true); // Automatically set ready when timer hits zero
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 pb-safe">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6 bg-white border-b border-slate-200/60 sticky top-0 z-50 pt-safe">
        <div className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight">
          <Shield size={20} color="#2563EB" strokeWidth={2.5} />
          <span>InterviewerAI</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          Waiting Room
        </div>
      </header>

      <main className="flex-1 flex justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-10 items-start">
          {/* Left: Video Card */}
          <div className="bg-white rounded-2xl sm:rounded-[24px] border border-slate-200/60 overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="relative bg-slate-950 aspect-[16/10] w-full overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                  <Wifi size={14} />
                  Stable Connection
                </div>
              </div>

            </div>
          </div>

          {/* Right: Info Panels */}
          <div className="flex flex-col gap-5 w-full">
            <div className="bg-white rounded-2xl sm:rounded-[20px] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">
                {ready ? 'Admission Active' : 'Interview Starts In'}
              </div>
              {ready ? (
                <div className="text-2xl sm:text-4xl font-black text-green-600 tracking-tight leading-none">Ready to join</div>
              ) : (
                <>
                  <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">{fmtTime(countdown)}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500 mt-2">Please stay on this page to be admitted</div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[20px] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">{jobTitle}</div>
              <div className="text-sm font-medium text-slate-500">Talent Acquisition Team</div>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-slate-50 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide border border-slate-100">
                ID: {interviewId} • 90 Minutes
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[20px] border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 text-blue-600 font-extrabold text-sm sm:text-base">{displayInitials}</div>
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">{recruiterName}</div>
                  <div className="text-xs sm:text-sm font-medium text-slate-500">Interviewer</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl sm:rounded-[20px] border border-amber-200/60 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <AlertTriangle size={18} className="stroke-[2.5px]" />
                <h3 className="font-bold text-sm sm:text-base tracking-tight">Mandatory Interview Protocols</h3>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-amber-900/80 font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><strong>Articulate Clearly:</strong> Project your voice with clarity and precision. Avoid murmuring or rushing your words to ensure accurate AI transcription.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><strong>Strictly Solo Environment:</strong> You must be the sole individual present in the camera's field of view at all times.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><strong>No Extraneous Devices:</strong> The use of secondary devices, including smartphones, tablets, or smartwatches, is strictly prohibited.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><strong>Focus and Engagement:</strong> Maintain continuous eye contact with the camera. Tab switching or minimizing the browser window will be flagged as a malpractice violation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span><strong>Professional Conduct:</strong> Approach this session with the same level of decorum as an in-person interview.</span>
                </li>
              </ul>
            </div>

            <div className="mt-2">
              <button
                className="w-full h-14 sm:h-15 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-h-[44px]"
                onClick={handleJoin}
                disabled={!ready}
              >
                Join Interview Session
                <ChevronRight size={20} />
              </button>
              <p className="text-center text-xs font-medium text-slate-400 mt-3">Make sure your hardware is still functioning correctly.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaitingRoom;
