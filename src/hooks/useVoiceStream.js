import { useState, useRef, useEffect, useCallback } from 'react';

export default function useVoiceStream({ onSilenceDetected, existingStream } = {}) {
  const [isListening, setReactIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isListeningRef = useRef(false);
  const setIsListening = useCallback((val) => {
    isListeningRef.current = val;
    setReactIsListening(val);
  }, []);

  const existingStreamRef = useRef(existingStream);
  useEffect(() => {
    existingStreamRef.current = existingStream;
  }, [existingStream]);
  const [amplitude, setAmplitude] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const backendFinalTextRef = useRef("");
  const accumulatedBrowserTextRef = useRef("");
  const hasFatalErrorRef = useRef(false);

  const onSilenceRef = useRef(onSilenceDetected);
  useEffect(() => { onSilenceRef.current = onSilenceDetected; }, [onSilenceDetected]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAmplitude(0);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (e) {
      console.warn("[STT] Error stopping browser recognition:", e);
    }

    try {
      if (!existingStreamRef.current && processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
    } catch (e) {
      console.warn("[STT] Error disconnecting processor:", e);
    }

    try {
      if (!existingStreamRef.current) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {}

    try {
      if (!existingStreamRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch (e) {}

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (!existingStreamRef.current) {
      audioContextRef.current = null;
      streamRef.current = null;
    }
    backendFinalTextRef.current = "";
    accumulatedBrowserTextRef.current = "";
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    hasFatalErrorRef.current = false;

    // We've disabled the browser's native SpeechRecognition (webkitSpeechRecognition) here
    // because it often produces poor results (especially for Indian accents) and continuously
    // overwrites the high-quality transcript coming from our local backend Whisper model.
    // The UI will now strictly rely on the websocket messages from the backend.

    // --- 2. SETUP BACKEND WEBSOCKET (For Robust Final Accuracy) ---
    try {
      const sessionToken = localStorage.getItem('interview_session_token');
      if (!sessionToken) {
        console.warn("[STT] No session token found.");
        hasFatalErrorRef.current = true;
        return;
      }

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const urlObj = new URL(API_BASE);
      const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${urlObj.host}/ws/stt/${sessionToken}/?token=${sessionToken}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[STT] WebSocket connected to Faster-Whisper");
        // Tell backend our exact hardware sample rate so it can use PyTorch to perfectly downsample!
        const ctxRate = audioContextRef.current ? audioContextRef.current.sampleRate : 16000;
        ws.send(JSON.stringify({ type: "config", sampleRate: ctxRate }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript') {
            const text = data.text;
            
            if (data.is_final) {
              setIsProcessing(false);
              backendFinalTextRef.current = text;
              
              const textToSubmit = backendFinalTextRef.current || voiceTranscript;
                                     
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              onSilenceRef.current?.(textToSubmit);
            }
          }
        } catch(e) {
          console.error("[STT] Error parsing WS message", e);
        }
      };

      ws.onerror = () => {
        hasFatalErrorRef.current = true;
        setIsProcessing(false);
      };
      ws.onclose = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      // --- 3. SETUP AUDIO CONTEXT (To send raw bytes to Backend) ---
      let stream = existingStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
      }
      streamRef.current = stream;

      // Ensure AudioContext exists and is running
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 16000 });
      }

      // ALWAYS recreate the ScriptProcessor to prevent Chrome from silently dropping the listener
      if (processorRef.current) {
        try { processorRef.current.disconnect(); } catch (e) {}
      }

      const audioContext = audioContextRef.current;
      
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaStreamSource(stream);
      } else {
        try { sourceRef.current.disconnect(); } catch (e) {}
      }
      const source = sourceRef.current;
      
      // Use AudioWorklet to prevent main-thread frame dropping!
      const workletCode = `
        class RecorderWorklet extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 4096;
            this.buffer = new Float32Array(this.bufferSize);
            this.bufferIndex = 0;
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0]) {
              const channelData = input[0];
              for (let i = 0; i < channelData.length; i++) {
                this.buffer[this.bufferIndex++] = channelData[i];
                if (this.bufferIndex >= this.bufferSize) {
                  const float32 = new Float32Array(this.buffer);
                  this.port.postMessage(float32.buffer, [float32.buffer]);
                  this.buffer = new Float32Array(this.bufferSize);
                  this.bufferIndex = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor('recorder-worklet', RecorderWorklet);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      
      const workletNode = new AudioWorkletNode(audioContext, 'recorder-worklet');
      processorRef.current = workletNode;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;
      
      source.connect(workletNode);
      workletNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      workletNode.port.onmessage = (e) => {
        if (!isListeningRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        wsRef.current.send(e.data);
        
        // Calculate amplitude for UI
        const pcm = new Float32Array(e.data);
        let sum = 0;
        for (let i = 0; i < pcm.length; i++) sum += Math.abs(pcm[i]);
        const avg = sum / pcm.length;
        setAmplitude(Math.min(avg * 100 * 5, 20));
      };

      setIsListening(true);
      setVoiceTranscript("");
      backendFinalTextRef.current = "";

    } catch (err) {
      console.error("[STT] Start failed:", err);
      stopListening();
    }
  }, [isListening, stopListening, setIsListening]);

  const finalizeTranscription = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsProcessing(true);
      wsRef.current.send(JSON.stringify({ type: "finalize" }));

      setIsListening(false);
      setAmplitude(0);

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      try {
        if (!existingStreamRef.current && processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
        }
      } catch (e) {
        console.warn("[STT] Error disconnecting processor:", e);
      }

      try {
        if (!existingStreamRef.current) {
          streamRef.current?.getTracks().forEach((t) => t.stop());
        }
      } catch (e) {}

      try {
        if (!existingStreamRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {}

      if (!existingStreamRef.current) {
        audioContextRef.current = null;
        streamRef.current = null;
      }
    }
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  return { isListening, isProcessing, amplitude, transcript: voiceTranscript, startListening, stopListening, finalizeTranscription };
}
