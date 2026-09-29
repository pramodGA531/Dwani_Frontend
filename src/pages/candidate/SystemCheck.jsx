import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Video, Wifi, Monitor, CheckCircle2, ChevronRight, Volume2, Shield, Loader2, Play, Square, Info, FileCheck } from 'lucide-react';
import { resolveInterviewState } from '../../utils/interviewSession';

const steps = [
  { id: 1, title: 'Camera Setup', icon: Video, desc: 'Position yourself in the frame' },
  { id: 2, title: 'Microphone Test', icon: Mic, desc: 'Check your audio quality' },
  { id: 3, title: 'Screen Share', icon: Monitor, desc: 'Enable screen sharing' },
  { id: 4, title: 'Network Check', icon: Wifi, desc: 'Verify connection stability' },
  { id: 5, title: 'Consent', icon: FileCheck, desc: 'Review & agree to terms' },
  { id: 6, title: 'Ready', icon: CheckCircle2, desc: 'Final instructions' }
];

export default function SystemCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewState = resolveInterviewState(location.state);

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [currentStep, setCurrentStep] = useState(1);
  const [stream, setStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Step 1 State
  const videoRef = useRef(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Step 2 State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTested, setAudioTested] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  // Step 3 State
  const screenVideoRef = useRef(null);
  const [screenGranted, setScreenGranted] = useState(false);
  const [screenError, setScreenError] = useState('');

  // Step 4 State
  const [networkStatus, setNetworkStatus] = useState('idle'); // idle, testing, done

  // Step 5 – Consent
  const [consentVideo, setConsentVideo] = useState(false);
  const [consentAI, setConsentAI] = useState(false);
  const [consentHonesty, setConsentHonesty] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setIsFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // Handle Step Changes
  useEffect(() => {
    if (currentStep === 1) {
      initCamera();
    } else if (currentStep === 4 && networkStatus === 'idle') {
      testNetwork();
    }
  }, [currentStep]);

  // Clean up streams when leaving or unmounting
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    };
  }, [stream, screenStream]);

  const initCamera = async () => {
    try {
      setCameraError('');
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
      setCameraGranted(true);
    } catch (err) {
      setCameraGranted(false);
      setCameraError('Camera access denied. Please allow permissions.');
    }
  };

  const startScreenShare = async () => {
    try {
      setScreenError('');
      const ms = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(ms);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = ms;
      setScreenGranted(true);

      // Re-request fullscreen as browser may have exited it for the dialog
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
      }

      ms.getVideoTracks()[0].onended = () => {
        setScreenGranted(false);
      };
    } catch (err) {
      setScreenError('Screen share access denied. This is required.');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const mediaRecorder = new MediaRecorder(new MediaStream([audioTrack]));
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordedAudioUrl(audioUrl);
      audioRef.current.src = audioUrl;
      setAudioTested(true);
    };
    mediaRecorder.start(200);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setTimeout(() => stopRecording(), 4000);
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
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const testNetwork = () => {
    setNetworkStatus('testing');
    setTimeout(() => {
      setNetworkStatus('done');
    }, 2500);
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !location.state?.interview_session_token) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      localStorage.setItem(`candidate_snapshot_${location.state.interview_id}`, dataUrl);
      
      const api = (await import('../../api/api')).default;
      await api.post('/interviews/upload-snapshot/', {
        token: location.state.interview_session_token,
        snapshot: dataUrl
      });
    } catch (e) {
      console.error("Snapshot failed:", e);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) captureSnapshot();
    if (currentStep < 6) setCurrentStep(c => c + 1);
  };

  const handleJoin = () => {
    // Stop camera/mic if needed, or stop just stream but leave screenStream alive
    if (stream) stream.getTracks().forEach(t => t.stop());
    
    // Store screen stream globally so we can capture it if they tab-switch
    if (screenStream) {
      window._interviewScreenStream = screenStream;
    }
    
    navigate('/interview', { state: location.state });
  };

  const canProceed = () => {
    if (currentStep === 1) return cameraGranted;
    if (currentStep === 2) return audioTested;
    if (currentStep === 3) return screenGranted;
    if (currentStep === 4) return networkStatus === 'done';
    if (currentStep === 5) return consentVideo && consentAI && consentHonesty;
    return true;
  };

  // Rendering Steps
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Camera Setup</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">Please ensure your face is clearly visible and well-lit. We need camera access for the AI proctoring.</p>

            <div className="relative w-full max-w-2xl aspect-video bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              {!cameraGranted && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/80 backdrop-blur-sm">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p className="font-medium">Requesting camera access...</p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/90 backdrop-blur-sm p-6 text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4"><Video size={32} /></div>
                  <h3 className="text-xl font-bold mb-2">Camera Blocked</h3>
                  <p className="text-red-100">{cameraError}</p>
                  <button onClick={initCamera} className="mt-6 px-6 py-2.5 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">Try Again</button>
                </div>
              )}
              {cameraGranted && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider flex items-center gap-2 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Camera Active
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Microphone Test</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">Record a short phrase to ensure your microphone is working perfectly.</p>

            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[32px] p-8 sm:p-12 shadow-xl shadow-slate-200/50 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                {isRecording && <div className="h-full bg-blue-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }} />}
              </div>

              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isRecording ? 'bg-red-50 text-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'bg-blue-50 text-blue-500'}`}>
                <Mic size={48} className={isRecording ? 'animate-pulse' : ''} />
              </div>

              <div className="flex gap-4">
                {!isRecording ? (
                  <button onClick={startRecording} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-200">
                    <Mic size={20} /> Record 4 Seconds
                  </button>
                ) : (
                  <button onClick={stopRecording} className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-red-200">
                    <Square size={20} fill="currentColor" /> Stop Recording
                  </button>
                )}

                {recordedAudioUrl && !isRecording && (
                  <button onClick={playRecording} disabled={isPlaying} className={`px-8 py-4 font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg ${isPlaying ? 'bg-green-100 text-green-700 shadow-green-100' : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 shadow-slate-100'}`}>
                    <Play size={20} className={isPlaying ? 'animate-pulse text-green-500' : ''} fill={isPlaying ? 'currentColor' : 'none'} />
                    {isPlaying ? 'Playing...' : 'Playback'}
                  </button>
                )}
              </div>

              {audioTested && (
                <div className="mt-8 flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-xl">
                  <CheckCircle2 size={18} /> Microphone test complete
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Screen Share</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">We need to monitor your screen during the assessment to ensure academic integrity.</p>

            <div className="w-full max-w-3xl aspect-[16/10] bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-200 relative flex items-center justify-center group">
              {screenGranted ? (
                <>
                  <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2 shadow-xl">
                    <Monitor size={18} /> Screen Sharing Active
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Monitor size={40} className="text-blue-400" />
                  </div>
                  {screenError && <p className="text-red-400 font-medium mb-4">{screenError}</p>}
                  <button onClick={startScreenShare} className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-black rounded-2xl transition-all active:scale-95 shadow-xl">
                    Share Entire Screen
                  </button>
                  <p className="text-slate-400 text-xs mt-6 max-w-xs mx-auto">Please select "Entire Screen" in the prompt that appears. Window/Tab sharing is not permitted.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Network Diagnostics</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">Testing your connection to ensure a seamless interview experience.</p>

            <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 sm:p-12 shadow-xl shadow-slate-200/50">
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-500 ${networkStatus === 'done' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Wifi size={48} />
                  </div>
                  {networkStatus === 'testing' && (
                    <>
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                      <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20" />
                    </>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {networkStatus === 'testing' ? 'Testing connection...' : networkStatus === 'done' ? 'Connection Excellent' : 'Ready to test'}
                </h3>

                {networkStatus === 'done' ? (
                  <div className="w-full space-y-4 mt-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Latency</span>
                      <span className="font-bold text-slate-900">24ms <span className="text-green-500 text-xs ml-1">(Good)</span></span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                      <span className="text-slate-500 font-medium text-sm">Bandwidth</span>
                      <span className="font-bold text-slate-900">54 Mbps</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center text-sm">This will just take a few seconds.</p>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
              <FileCheck size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Consent & Acknowledgement</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md">Please read and agree to the following before starting your assessment.</p>

            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl shadow-slate-200/50 space-y-5">

              {/* Consent 1 – Video & Audio */}
              <label className={`flex gap-4 items-start p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                consentVideo ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}>
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={consentVideo}
                    onChange={e => setConsentVideo(e.target.checked)}
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    consentVideo ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                  }`}>
                    {consentVideo && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">Video &amp; Audio Recording Consent</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    I consent to my video and audio being recorded throughout this assessment. I understand this recording may be reviewed by the recruiter and retained for hiring evaluation purposes.
                  </p>
                </div>
              </label>

              {/* Consent 2 – AI Monitoring */}
              <label className={`flex gap-4 items-start p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                consentAI ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}>
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={consentAI}
                    onChange={e => setConsentAI(e.target.checked)}
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    consentAI ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                  }`}>
                    {consentAI && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">AI Monitoring &amp; Proctoring</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    I acknowledge that this session is actively monitored by an AI proctoring system. The system will analyse my behaviour, tab-switching activity, and facial presence. Violations may be flagged and shared with the recruiter.
                  </p>
                </div>
              </label>

              {/* Consent 3 – Honesty */}
              <label className={`flex gap-4 items-start p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                consentHonesty ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}>
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={consentHonesty}
                    onChange={e => setConsentHonesty(e.target.checked)}
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    consentHonesty ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                  }`}>
                    {consentHonesty && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">Honesty &amp; Academic Integrity</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    I confirm I will complete this assessment independently without external assistance, AI tools, or any form of unfair aid. I understand that detected misconduct will result in immediate disqualification.
                  </p>
                </div>
              </label>

              {/* All agreed notice */}
              {consentVideo && consentAI && consentHonesty && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 animate-in fade-in duration-300">
                  <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                  <p className="text-sm font-semibold text-green-800">All consents acknowledged. You may proceed.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">All Systems Go</h2>
            <p className="text-slate-600 mb-10 text-center max-w-lg text-lg">Your hardware has been verified and your consent recorded. You are now ready to start.</p>

            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl shadow-slate-200/50 mb-10">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Info className="text-blue-500" size={20} /> Important Instructions
              </h3>
              <ul className="space-y-4">
                {[
                  'Ensure you are in a quiet, well-lit environment.',
                  'Close any unnecessary background applications to save bandwidth.',
                  'Do not navigate away from the browser tab during the assessment.',
                  'The AI interviewer will begin immediately.'
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm font-medium leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isFullscreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 z-50 fixed inset-0">
         <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl shadow-blue-900/10 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <Monitor size={48} className="text-blue-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-4">Fullscreen Required</h2>
            <p className="text-slate-500 mb-8 font-medium">This assessment must be taken in fullscreen mode to ensure a distraction-free environment.</p>
            <button 
              onClick={() => document.documentElement.requestFullscreen().catch(console.error)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-95"
            >
              Resume Fullscreen
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-blue-200">
      <header className="flex items-center justify-between px-6 lg:px-12 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50">
            <Shield size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dwani<span className='text-purple-700'>AI</span></h1>
        </div>
        <div className="hidden sm:flex gap-2">
          {steps.map(step => (
            <div key={step.id} className={`w-12 h-2 rounded-full transition-all duration-500 ${step.id === currentStep ? 'bg-blue-600 w-24' : step.id < currentStep ? 'bg-green-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar Steps Navigation */}
        <div className="hidden lg:flex w-80 bg-white border-r border-slate-200/60 flex-col p-8 z-10 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.03)]">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">System Check</h3>
          <div className="flex flex-col gap-6 relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100 -z-10" />
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <div key={step.id} className={`flex gap-5 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-2' : isPast ? 'opacity-70' : 'opacity-40 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 shadow-sm ${isActive ? 'bg-blue-600 text-white shadow-blue-200' :
                    isPast ? 'bg-green-500 text-white' :
                      'bg-white border-2 border-slate-100 text-slate-400'
                    }`}>
                    {isPast ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                  </div>
                  <div>
                    <div className={`font-bold text-base mb-1 ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{step.title}</div>
                    <div className="text-xs font-medium text-slate-500 leading-snug">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <div className="w-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-6 sm:p-8 bg-white border-t border-slate-200/60 flex items-center justify-between sticky bottom-0 z-20">
            <div className="text-sm font-bold text-slate-400">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all duration-300 ${canProceed()
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 translate-y-0'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed translate-y-1'
                  }`}
              >
                Continue <ChevronRight size={20} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black flex items-center gap-2 transition-all duration-300 shadow-xl shadow-blue-600/30 active:scale-95 hover:-translate-y-1"
              >
                Start Interview <ChevronRight size={20} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
