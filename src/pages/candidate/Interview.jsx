import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInterview } from '../../context/InterviewContext';
import {
  Bot, User, Clock, Mic, Pin, MoreVertical
} from 'lucide-react';
import VoiceInit from '../../components/interviews/VoiceInit';
import useVoiceStream from '../../hooks/useVoiceStream';
import api from '../../api/api';
import { resolveInterviewState, clearInterviewSession } from '../../utils/interviewSession';

const ActiveInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = useInterview();

  const rawState = location.state || {};
  // Recover state from sessionStorage on page refresh (React Router loses state on F5)
  const interviewState = resolveInterviewState(rawState);

  const token = interviewState.interview_session_token;
  const interviewId = interviewState.interview_id;

  const {
    questions = [],
    currentIndex = 0,
    currentQuestion = null,
    answers = {},
    isComplete = false,
    loading = false,
    numQuestions = 5,
    submitAnswer,
    startInterview,
  } = context || {};

  const [transcript, setTranscript] = useState('');
  const [accumulatedAnswer, setAccumulatedAnswer] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(() => {
    const storageKey = `interview_start_timestamp_${interviewId}`;
    const savedStart = localStorage.getItem(storageKey);
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStart, 10)) / 1000);
      return Math.max(0, 1800 - elapsed);
    }
    localStorage.setItem(storageKey, Date.now().toString());
    return 1800;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [terminationMessage, setTerminationMessage] = useState(null);
  const [model, setModel] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);

  const videoRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });

  const utteranceRef = useRef(null);
  const hasStartedRef = useRef(false);

  const handleFinalTranscriptReceived = useCallback((text) => {
    const cleanText = (text || transcript || '').trim();
    if (!cleanText || loading) return;
    setAccumulatedAnswer((prev) => (prev + " " + cleanText).trim() + " ");
    setTranscript('');
  }, [transcript, loading]);

  const { isListening, isProcessing, amplitude, startListening, stopListening, transcript: voiceTranscript, finalizeTranscription } = useVoiceStream({
    onSilenceDetected: handleFinalTranscriptReceived,
    existingStream: mediaStream,
    sessionToken: token
  });

  const candidateName = interviewState.candidate_name || 'Candidate';
  const profilePic = localStorage.getItem(`candidate_snapshot_${interviewId}`) || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  useEffect(() => {
    if (voiceTranscript !== undefined) setTranscript(voiceTranscript);
  }, [voiceTranscript]);

  useEffect(() => {
    // If the page is refreshed, state is lost. 
    // This auto-resumes the session from the backend if it's not already loading.
    if (questions.length === 0 && !loading && startInterview && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startInterview(token, interviewId);
    }
  }, [questions.length, loading, startInterview, token, interviewId]);

  useEffect(() => {
    // Disable Back Button
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.go(1);
    };
    window.addEventListener('popstate', handlePopState);

    // Warn on reload
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Abandon on close
    const handleUnload = () => {
      if (token && !isComplete) {
        const formData = new FormData();
        formData.append('token', token);
        navigator.sendBeacon(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/interviews/abandon-session/`, formData);
      }
    };
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isComplete]);

  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Camera & Timer
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Request video separately
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Request audio separately to guarantee the browser selects the OS Default Microphone 
        // (like a headset) rather than forcing the Webcam's low-quality built-in microphone!
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setLocalVideoStream(videoStream);
        setMediaStream(audioStream);
      } catch (err) {
        console.error("Camera failed:", err);
      }
    };
    initCamera();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (videoRef.current && localVideoStream) {
      videoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream, currentQuestion]);

  useEffect(() => {
    if (isComplete) {
      clearInterviewSession();
      navigate('/submission', { state: interviewState });
    }
  }, [isComplete, navigate, interviewState]);

  // Mobile Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reportAnomaly = async (eventType, severity, terminate = false, imageBlob = null) => {
    try {
      if (!token) return;

      const formData = new FormData();
      formData.append('token', token);
      formData.append('event_type', eventType);
      formData.append('severity', severity);
      formData.append('terminate', terminate);
      
      if (imageBlob) {
        formData.append('image', imageBlob, 'snapshot.png');
      }

      await api.post('/interviews/anomaly/', formData);
    } catch (err) {
      console.error("Failed to report anomaly", err);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isComplete && !terminationMessage) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        
        const willTerminate = newCount >= 300;
        const captureAndReport = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let camVideo = null;
            let screenVideo = null;
            
            // Setup Camera Video
            if (videoRef.current && videoRef.current.readyState === 4) {
               camVideo = videoRef.current;
            }
            
            // Setup Screen Video
            if (window._interviewScreenStream) {
               screenVideo = document.createElement('video');
               screenVideo.srcObject = window._interviewScreenStream;
               screenVideo.muted = true;
               await screenVideo.play().catch(e => console.log(e));
            }
            
            if (camVideo && screenVideo) {
               canvas.width = 1280;
               canvas.height = 480;
               ctx.fillStyle = '#000';
               ctx.fillRect(0, 0, 1280, 480);
               
               // Draw cam left
               const cAspect = camVideo.videoWidth / camVideo.videoHeight;
               let cw = 640;
               let ch = 640 / cAspect;
               if (ch > 480) { ch = 480; cw = 480 * cAspect; }
               ctx.drawImage(camVideo, (640 - cw)/2, (480 - ch)/2, cw, ch);
               
               // Draw screen right
               const sAspect = screenVideo.videoWidth / screenVideo.videoHeight;
               let sw = 640;
               let sh = 640 / sAspect;
               if (sh > 480) { sh = 480; sw = 480 * sAspect; }
               ctx.drawImage(screenVideo, 640 + (640 - sw)/2, (480 - sh)/2, sw, sh);
            } else if (camVideo) {
               canvas.width = camVideo.videoWidth;
               canvas.height = camVideo.videoHeight;
               ctx.drawImage(camVideo, 0, 0, canvas.width, canvas.height);
            } else if (screenVideo) {
               canvas.width = screenVideo.videoWidth;
               canvas.height = screenVideo.videoHeight;
               ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
            } else {
               reportAnomaly('Tab Switch Warning', willTerminate ? 'high' : 'medium', willTerminate);
               return;
            }
            
            canvas.toBlob(blob => {
              reportAnomaly('Tab Switch Warning', willTerminate ? 'high' : 'medium', willTerminate, blob);
            }, 'image/jpeg', 0.8);
          } catch (e) {
            reportAnomaly('Tab Switch Warning', willTerminate ? 'high' : 'medium', willTerminate);
          }
        };
        captureAndReport();
        
        if (willTerminate) {
          setTerminationMessage("Interview Terminated due to Malpractice: Tab Switching limit exceeded.");
          // Wait briefly before ending
          setTimeout(() => {
            navigate('/submission', { state: interviewState });
          }, 3000);
        } else {
          setWarningMessage({
            title: "Warning: Tab Switched",
            message: `Please do not switch tabs or minimize the window during the interview. Doing this ${300 - newCount} more time(s) will terminate your interview.`
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isComplete, terminationMessage, navigate, tabSwitchCount]);

  useEffect(() => {
    // Disabled object detection completely to prevent main thread freezing.
    // If you wish to re-enable this, it will load dynamically so it won't bloat the main bundle:
    // const timer = setTimeout(() => {
    //   Promise.all([
    //     import('@tensorflow/tfjs'),
    //     import('@tensorflow-models/coco-ssd')
    //   ]).then(([_, cocoSsd]) => {
    //     cocoSsd.load().then(loadedModel => {
    //       setModel(loadedModel);
    //     }).catch(err => console.error("Failed to load COCO-SSD model", err));
    //   }).catch(err => console.error("Failed to dynamically import TensorFlow", err));
    // }, 2000);
    // return () => clearTimeout(timer);
  }, []);

  // Object Detection Loop (Disabled to prevent freezing)
  useEffect(() => {
    /*
    let animationId;
    let lastDetectionTime = 0;
    // Debounce alerts so we don't spam the UI
    let lastAlertTime = 0;

    const detectFrame = async () => {
      if (!model || !videoRef.current || videoRef.current.readyState !== 4 || isComplete || terminationMessage) {
        animationId = requestAnimationFrame(detectFrame);
        return;
      }

      const now = Date.now();
      if (now - lastDetectionTime > 1500) { // Check every 1.5 seconds
        lastDetectionTime = now;
        try {
          const predictions = await model.detect(videoRef.current);
          let phones = 0;
          let people = 0;
          
          predictions.forEach(p => {
            if (p.class === 'cell phone') phones++;
            if (p.class === 'person') people++;
          });

          if (phones > 0 || people > 1) {
            const timeSinceAlert = now - lastAlertTime;
            if (timeSinceAlert > 10000) { // Only alert once every 10 seconds max
              lastAlertTime = now;
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob(blob => {
                if (blob) {
                  const violationType = phones > 0 ? "Tech Object Detected (Cell Phone)" : "Multiple People Detected";
                  reportAnomaly(violationType, 'high', false, blob);
                  setWarningMessage({
                    title: `Warning: ${violationType}`,
                    message: "Please maintain a clean environment. This incident has been recorded."
                  });
                }
              }, 'image/png');
            }
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }
      animationId = requestAnimationFrame(detectFrame);
    };

    if (model) {
      detectFrame();
    }

    return () => cancelAnimationFrame(animationId);
    */
  }, [model, isComplete, terminationMessage]);

  const progress = numQuestions ? Math.round(((currentIndex + 1) / numQuestions) * 100) : 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Drag Handlers
  const handleDragStart = (e) => {
    if (isPinned) return;
    dragRef.current.isDragging = true;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.initX = position.x;
    dragRef.current.initY = position.y;
  };

  const handleDragMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 280, dragRef.current.initX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 260, dragRef.current.initY + dy))
    });
  };

  const handleDragEnd = () => dragRef.current.isDragging = false;

  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  const toggleRecording = () => {
    if (isListening) {
      finalizeTranscription();
      // stopListening is handled internally once data arrives
    } else {
      // Cancel any ongoing TTS before mic activates to avoid feedback
      window.speechSynthesis?.cancel();
      startListening();
    }
  };

  const submitFinalAnswer = () => {
    if (isListening) {
      finalizeTranscription();
    }
    const finalAnswer = (accumulatedAnswer + " " + transcript).trim();
    submitAnswer(currentIndex, finalAnswer);
    setTranscript('');
    setAccumulatedAnswer('');
  };

  // ── TTS: speak each new question automatically ────────────────────────────
  // Runs whenever currentQuestion changes (new question arrives from Groq)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!currentQuestion?.text) return;
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    // Auto-start disabled, user will manually click "Start Answering"
    utterance.onend = () => {
      // startListening();
    };
    utteranceRef.current = utterance; // Keep strong reference so Chrome doesn't GC mid-speech
    window.speechSynthesis?.speak(utterance);
  }, [currentQuestion?.text]); // eslint-disable-line

  const handleFinish = () => {
    // Treat the current text as the final answer and force completion
    const finalAnswer = (accumulatedAnswer + " " + transcript).trim();
    if (finalAnswer) {
      submitAnswer(currentIndex, finalAnswer, true);
    } else {
      // If there's literally no answer, just finish via an empty submission
      submitAnswer(currentIndex, "", true);
    }
    setTranscript('');
    setAccumulatedAnswer('');
  };

  if (terminationMessage) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
        </div>
        <h2 className="text-2xl font-bold text-red-900 mb-2">Interview Terminated</h2>
        <p className="text-red-700 max-w-md">{terminationMessage}</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] text-slate-800 space-y-4">
        <h2 className="text-2xl font-bold">Loading Interview...</h2>
        <div className="bg-white p-4 rounded shadow border border-red-200">
          <p><strong>Debug Info:</strong></p>
          <p>Questions Length: {questions?.length}</p>
          <p>Current Index: {currentIndex}</p>
          <p>Loading State: {loading ? "True" : "False"}</p>
          <p>Is Complete: {isComplete ? "True" : "False"}</p>
          <p>Token: {token || "None"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative font-sans">
      {/* Ambient Premium Glows (Light Mode) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-200/30 rounded-full blur-[120px] mix-blend-multiply" />
        {isListening && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-blue-300/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse" />
        )}
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-5">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tracking-tight flex items-center gap-2">
              <Bot size={28} className="text-blue-600" />
              Dwani
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock size={16} className="text-blue-500" /> {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end mt-2 sm:mt-0">
            <div className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-2 uppercase">
              Question {currentIndex + 1} <span className="opacity-50">of</span> {numQuestions}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 sm:w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                  style={{ width: `${progress}%` }} 
                >
                  <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <div className="text-[10px] font-black text-blue-600 w-8">{progress}%</div>
            </div>
          </div>
        </div>
      </header>

      {/* Warnings */}
      {warningMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-amber-50 backdrop-blur-xl border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-md animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
          <div>
            <h4 className="font-bold mb-1 text-amber-700">{warningMessage.title}</h4>
            <p className="text-sm opacity-90">{warningMessage.message}</p>
            <button onClick={() => setWarningMessage(null)} className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-500 underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-32 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interview Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* History */}
          {currentIndex > 0 && (
            <div className="space-y-8 mb-12 opacity-80">
              {questions.slice(0, currentIndex).map((q, idx) => {
                const answer = answers[idx];
                return (
                  <div key={idx} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                        <Bot size={20} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                          <p className="text-[15px] leading-relaxed text-slate-700">{q.text}</p>
                        </div>
                      </div>
                    </div>
                    {answer && (
                      <div className="flex gap-4 flex-row-reverse">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                          <img src={profilePic} alt={candidateName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 max-w-[85%]">
                          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
                            <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{answer}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Current Question */}
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-[20px] bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px] shrink-0 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-white rounded-[19px] flex items-center justify-center">
                <Bot size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400" />
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black tracking-widest rounded-full uppercase">Now Asking</div>
                  <div className="px-4 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-black tracking-widest rounded-full uppercase border border-slate-200">
                    {currentQuestion.category || 'BEHAVIORAL'}
                  </div>
                </div>
                <p className="text-xl sm:text-2xl leading-relaxed text-slate-900 font-bold">
                  {currentQuestion.text}
                </p>
              </div>
            </div>
          </div>

          {/* Answer Area */}
          <div className="flex gap-4 flex-row-reverse mt-8">
            <div className="w-12 h-12 rounded-[20px] overflow-hidden shrink-0 border border-slate-200 shadow-md hidden sm:block">
              <img src={profilePic} alt={candidateName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className={`bg-white rounded-[32px] p-6 sm:p-8 min-h-[180px] relative overflow-hidden transition-all duration-500 shadow-lg
                ${isListening ? 'border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-4 ring-blue-50' : isProcessing ? 'border-2 border-purple-300 shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'border border-slate-200 hover:border-slate-300'}`}
              >
                
                {/* Loaders */}
                {loading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                    <span className="text-sm font-bold text-slate-600 animate-pulse tracking-wide">Evaluating Response...</span>
                  </div>
                )}
                
                {isProcessing && !loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center border-t border-purple-200 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 bg-purple-50 px-6 py-3 rounded-full border border-purple-100">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                       </div>
                      <span className="text-sm font-bold text-purple-700 tracking-wide">Transcribing...</span>
                    </div>
                  </div>
                )}

                {/* Live Voice Visualizer */}
                {isListening && !loading && (
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-blue-50 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${Math.min(100, Math.max(5, amplitude * 100))}%` }} 
                    />
                  </div>
                )}

                {/* Text Area */}
                <div className="w-full h-full min-h-[120px] text-[16px] sm:text-[17px] leading-relaxed relative z-0 whitespace-pre-wrap">
                  {accumulatedAnswer.trim() ? (
                    <span className="text-slate-800 font-medium">{accumulatedAnswer.trim()}</span>
                  ) : (
                    <span className="text-slate-400 font-medium">Listen carefully and respond to the interviewer...</span>
                  )}
                </div>
                
                {/* Floating "Listening" Badge */}
                {isListening && !loading && (
                  <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-black tracking-widest px-4 py-2 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-pulse uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Listening
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <button 
                  onClick={toggleRecording}
                  disabled={loading || isProcessing}
                  className={`px-8 py-4 rounded-2xl text-sm font-black tracking-wide flex items-center gap-3 transition-all duration-300 shadow-xl
                    ${isListening 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 ring-4 ring-red-50' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 border border-blue-600'}`}
                >
                  <Mic size={20} className={isListening ? "animate-pulse" : ""} />
                  {isListening ? 'Stop Recording' : 'Start Answering'}
                </button>
                <button 
                  onClick={submitFinalAnswer}
                  disabled={loading || isListening || isProcessing}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-black tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 shadow-sm"
                >
                  Submit & Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Camera (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 bg-white/60 backdrop-blur-2xl border border-slate-200 rounded-[32px] p-2 shadow-2xl shadow-slate-200/50">
            <div className="relative rounded-[28px] overflow-hidden aspect-[4/3] bg-black shadow-inner">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">Rec</span>
                </div>
              </div>
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[28px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Camera for Mobile Only */}
      {isMobile && (
        <div
          className="fixed bg-white rounded-2xl overflow-hidden shadow-2xl z-50 border border-slate-200"
          style={{
            top: `${position.y || 80}px`,
            left: `${position.x || window.innerWidth - 180}px`,
            width: '160px',
            aspectRatio: '3 / 4',
            cursor: isPinned ? 'default' : 'move'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute top-2 right-2 flex gap-1 text-white z-10">
            <button onClick={() => setIsPinned(!isPinned)} className="p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-lg border border-white/10">
              <Pin size={14} className={isPinned ? "fill-current text-blue-400" : ""} />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200/60 py-4 px-6 flex justify-center items-center z-40">
        <button
          onClick={handleFinish}
          disabled={loading}
          className="px-6 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black tracking-widest uppercase"
        >
          End Interview Early
        </button>
      </div>

      <VoiceInit />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ActiveInterview;
