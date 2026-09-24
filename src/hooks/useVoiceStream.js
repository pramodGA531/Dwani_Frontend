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
  const [audioUrl, setAudioUrl] = useState(null);

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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const onSilenceRef = useRef(onSilenceDetected);
  useEffect(() => { onSilenceRef.current = onSilenceDetected; }, [onSilenceDetected]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAmplitude(0);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e) {}
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
            } else {
              // Update the React state to show partial transcript
              setVoiceTranscript(text);
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
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch(e) {}
        }
      };

      // --- 3. SETUP AUDIO CONTEXT (To send raw bytes to Backend) ---
      let stream = existingStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      }
      streamRef.current = stream;

      // Ensure AudioContext exists and is running
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        // Do NOT force 16000 Hz — Chrome software-resamples from 48kHz which causes
        // the noisy/distorted audio. Run at native hardware rate instead.
        audioContextRef.current = new AudioCtx();
      }

      // ALWAYS recreate the ScriptProcessor to prevent Chrome from silently dropping the listener
      if (processorRef.current) {
        try { processorRef.current.disconnect(); } catch (e) {}
      }

      const audioContext = audioContextRef.current;
      const nativeSampleRate = audioContext.sampleRate; // typically 48000
      const targetSampleRate = 16000;
      const downsampleRatio = Math.round(nativeSampleRate / targetSampleRate); // 3

      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch (e) {}
      }
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      const source = sourceRef.current;
      
      // Audio analysis showed RMS=0.04 (very quiet, ideal is 0.15-0.30).
      // Max amplitude is only 0.36 so 4x gain is safe — no clipping risk.
      const boostNode = audioContext.createGain();
      boostNode.gain.value = 4.0;
      source.connect(boostNode);
      
      // Use a unique processor name per session — the AudioWorkletGlobalScope
      // is shared within an AudioContext, so re-registering the same name on
      // subsequent recordings throws NotSupportedError: already registered.
      const workletName = `recorder-worklet-${Date.now()}`;
      const workletCode = `
        class RecorderWorklet extends AudioWorkletProcessor {
          constructor(options) {
            super();
            this.ratio = (options.processorOptions && options.processorOptions.downsampleRatio) || 3;
            this.outputBufferSize = 1024;  // 64ms at 16kHz — smaller = less initial delay
            this.outputBuffer = new Float32Array(this.outputBufferSize);
            this.outputIndex = 0;
            this.accumulator = [];
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0]) {
              const channelData = input[0];
              for (let i = 0; i < channelData.length; i++) {
                this.accumulator.push(channelData[i]);
                if (this.accumulator.length >= this.ratio) {
                  // Average downsample: cleaner than decimation
                  let sum = 0;
                  for (let j = 0; j < this.ratio; j++) sum += this.accumulator[j];
                  this.outputBuffer[this.outputIndex++] = sum / this.ratio;
                  this.accumulator = [];
                  if (this.outputIndex >= this.outputBufferSize) {
                    const out = new Float32Array(this.outputBuffer);
                    this.port.postMessage(out.buffer, [out.buffer]);
                    this.outputBuffer = new Float32Array(this.outputBufferSize);
                    this.outputIndex = 0;
                  }
                }
              }
            }
            return true;
          }
        }
        registerProcessor('${workletName}', RecorderWorklet);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);
      
      const workletNode = new AudioWorkletNode(audioContext, workletName, {
        processorOptions: { downsampleRatio }
      });
      processorRef.current = workletNode;
      
      // We mute the worklet node's output to destination to avoid hearing ourselves (feedback)
      const muteNode = audioContext.createGain();
      muteNode.gain.value = 0;
      
      boostNode.connect(workletNode);
      workletNode.connect(muteNode);
      muteNode.connect(audioContext.destination);

      // Create a destination node for the MediaRecorder to capture the boosted audio
      const destNode = audioContext.createMediaStreamDestination();
      boostNode.connect(destNode);

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

      // Start local recording for playback
      setAudioUrl(null);
      audioChunksRef.current = [];
      try {
        const mediaRecorder = new MediaRecorder(destNode.stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioUrl(URL.createObjectURL(blob));
        };
        mediaRecorder.start();
      } catch (err) {
        console.warn("[STT] Failed to start MediaRecorder", err);
      }

    } catch (err) {
      console.error("[STT] Start failed:", err);
      stopListening();
    }
  }, [isListening, stopListening, setIsListening]);

  const finalizeTranscription = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsProcessing(true);
      wsRef.current.send(JSON.stringify({ type: "finalize" }));

      setIsListening(false);
      setAmplitude(0);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Wait 800ms before tearing down the audio pipeline.
      // The AudioWorklet buffers 4096 samples (~256ms at 16kHz) before sending each
      // message. Without this delay, the last buffer is dropped when we disconnect,
      // causing the transcript to be cut off mid-sentence.
      await new Promise((resolve) => setTimeout(resolve, 800));

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

  return { isListening, isProcessing, amplitude, transcript: voiceTranscript, audioUrl, startListening, stopListening, finalizeTranscription };
}
