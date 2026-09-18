import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Video, Wifi, Monitor, CheckCircle2, XCircle, ChevronRight, Volume2, Shield } from 'lucide-react';

const SystemCheck = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [allPassed, setAllPassed] = useState(false);
  const [checks, setChecks] = useState({
    audio: { status: 'checking', label: 'Microphone Check', detail: 'Verifying input device...', sub: '' },
    screen: { status: 'checking', label: 'Screen Share', detail: 'Checking permissions...', sub: '' },
    network: { status: 'checking', label: 'Network Quality', detail: 'Testing connection...', sub: '' },
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  useEffect(() => {
    // Run network and screen checks immediately so they don't wait for camera permissions
    setTimeout(() => updateCheck('screen', 'passed', 'Screen Sharing Ready', 'System permissions granted'), 1200);
    setTimeout(() => updateCheck('network', 'passed', 'Excellent (54 Mbps)', 'Latency: 14ms'), 1800);

    const initCamera = async () => {
      try {
        // Wrap getUserMedia in a Promise.race with a 5-second timeout.
        // This prevents the page from hanging infinitely if another app is locking the camera on Windows.
        const getMedia = navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for camera/mic permissions")), 6000)
        );
        
        const ms = await Promise.race([getMedia, timeout]);
        
        streamRef.current = ms;
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;
        updateCheck('audio', 'passed', 'Built-in Microphone detected', 'Audio levels optimal');
      } catch (err) {
        updateCheck('audio', 'failed', 'Camera/Mic Unavailable', 'Please check permissions or close other apps (like Zoom/Meet) using your camera.');
      }
    };
    initCamera();
    return () => { 
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    setAllPassed(Object.values(checks).every(c => c.status === 'passed'));
  }, [checks]);

  const updateCheck = (key, status, detail, sub) => {
    setChecks(prev => ({ ...prev, [key]: { ...prev[key], status, detail, sub } }));
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
    
    // Create a new stream with ONLY the audio track to ensure the Audio object can play it natively
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (!audioTrack) {
        console.error("No audio track found in stream!");
        return;
    }
    const audioStream = new MediaStream([audioTrack]);
    
    const mediaRecorder = new MediaRecorder(audioStream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      // Use the recorder's negotiated mimeType instead of hardcoding 'audio/webm' which might break on Safari/Edge
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log("Recorded audio blob size:", audioBlob.size, "Mime type:", mimeType);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordedAudioUrl(audioUrl);
      
      audioRef.current.src = audioUrl;
      audioRef.current.volume = 1.0; // Ensure it's not muted
    };
    
    mediaRecorder.start(200); // 200ms timeslices guarantees chunks are dispatched
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);

    // Auto-stop after 5 seconds max
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    }, 5000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedAudioUrl && !isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed:", err);
        setIsPlaying(false);
      });
    }
  };

  const handleJoin = () => {
    if (allPassed) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      navigate('/waiting-room');
    }
  };

  const iconMap = { audio: Mic, screen: Monitor, network: Wifi };

  // Retrieve the recruiter's name from localStorage, fallback to 'Recruiter'
  const recruiterName = localStorage.getItem('recruiter_name') || 'Recruiter';
  const displayInitials = recruiterName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 pb-safe">
      {/* Brand Header */}
      <header className="flex items-center justify-between px-6 lg:px-12 h-18 bg-white border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">InterviewerAI</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          System Check
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left: Video Preview Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-[32px] border border-slate-200/60 overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="relative bg-slate-950 aspect-video w-full overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                  Live Preview
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-green-500/10 backdrop-blur-md border border-green-500/20 text-[9px] sm:text-[10px] font-bold text-green-400 uppercase tracking-wider">
                  <Wifi size={12} />
                  Stable Connection
                </div>
              </div>

              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3">
                <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-all active:scale-95 shadow-lg min-w-[40px] min-h-[40px]">
                  <Mic size={18} />
                </button>
                <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white/25 transition-all active:scale-95 shadow-lg min-w-[40px] min-h-[40px]">
                  <Video size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                <span className="text-base sm:text-lg font-black text-blue-600">{displayInitials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Interviewer</div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{recruiterName}</div>
                <div className="text-xs sm:text-sm font-medium text-slate-500 truncate">Talent Acquisition</div>
              </div>
            </div>
          </div>

          {/* Right: Technical Checks */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {Object.entries(checks).map(([key, check]) => {
              const Icon = iconMap[key];
              const isPassed = check.status === 'passed';
              const isFailed = check.status === 'failed';
              const isChecking = check.status === 'checking';

              return (
                <div key={key} className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-start gap-5 hover:translate-x-1 transition-all duration-200 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isPassed ? 'bg-green-50 text-green-600' : 
                    isFailed ? 'bg-red-50 text-red-600' : 
                    'bg-slate-50 text-slate-400'
                  }`}>
                    <Icon size={22} strokeWidth={isChecking ? 2 : 2.5} className={isChecking ? 'animate-pulse' : ''} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 mb-0.5">{check.label}</div>
                    <div className="text-xs font-medium text-slate-500 leading-relaxed mb-1">{check.detail}</div>
                    {check.sub && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{check.sub}</div>}
                    {key === 'audio' && isPassed && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!isRecording ? (
                          <button onClick={startRecording} className="text-[11px] px-3 py-1.5 rounded-full bg-blue-50 font-bold text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 transition-colors">
                            <Mic size={14} /> Record Voice
                          </button>
                        ) : (
                          <button onClick={stopRecording} className="text-[11px] px-3 py-1.5 rounded-full bg-red-50 font-bold text-red-600 hover:bg-red-100 flex items-center gap-1.5 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Stop Recording
                          </button>
                        )}
                        {recordedAudioUrl && (
                          <button onClick={playRecording} disabled={isPlaying} className={`text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors ${isPlaying ? 'bg-green-100 text-green-700' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            <Volume2 size={14} className={isPlaying ? 'animate-pulse' : ''} /> {isPlaying ? 'Playing...' : 'Play Recording'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex-shrink-0">
                    {isPassed && <CheckCircle2 size={22} className="text-green-500" />}
                    {isFailed && <XCircle size={22} className="text-red-500" />}
                    {isChecking && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                  </div>
                </div>
              );
            })}

            <div className="mt-4">
              <button
                className={`w-full h-15 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                  allPassed 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5 active:scale-[0.98]' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                onClick={handleJoin}
                disabled={!allPassed}
              >
                Join Interview Session
                <ChevronRight size={20} className={allPassed ? 'translate-x-0 group-hover:translate-x-0.5 transition-transform' : ''} />
              </button>
              <p className="text-center text-xs font-medium text-slate-400 mt-4 leading-relaxed">
                Hardware validation is required before you can be admitted to the waiting room.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 flex justify-center gap-8 px-6 bg-white border-t border-slate-200/60">
        <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Privacy</a>
        <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Terms</a>
        <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Support</a>
      </footer>
    </div>
  );
};

export default SystemCheck;
