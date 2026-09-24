import React, { useEffect, useState } from 'react';
import useVoiceStream from '../hooks/useVoiceStream';

export default function STTTest() {
  const [transcripts, setTranscripts] = useState([]);
  const [pendingTranscript, setPendingTranscript] = useState(null);
  
  // Set mock session token for testing the STT endpoint
  useEffect(() => {
    localStorage.setItem('interview_session_token', 'test_stt');
    return () => {
      localStorage.removeItem('interview_session_token');
    };
  }, []);

  const handleSilenceDetected = (finalText) => {
    if (finalText && finalText.trim() !== '' && finalText !== "candidate didnt respondedd") {
      setPendingTranscript(finalText);
    }
  };

  const confirmSendToAI = () => {
    if (pendingTranscript) {
      setTranscripts(prev => [...prev, pendingTranscript]);
      setPendingTranscript(null);
    }
  };

  const cancelTranscript = () => {
    setPendingTranscript(null);
  };

  const {
    isListening,
    isProcessing,
    amplitude,
    transcript,
    audioUrl,
    startListening,
    stopListening,
    finalizeTranscription
  } = useVoiceStream({
    onSilenceDetected: handleSilenceDetected
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-400 mb-8">STT Model Test Environment</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-3xl mb-8 border border-gray-700 flex flex-col items-center">
        <div className="flex gap-4 mb-8">
          {!isListening ? (
            <button
              onClick={startListening}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/50"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={finalizeTranscription}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-red-900/50"
            >
              Stop & Finalize
            </button>
          )}
        </div>

        <div className="w-full bg-gray-700 h-8 rounded-full overflow-hidden mb-4 relative">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-75"
            style={{ width: `${amplitude}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 font-mono">
          Status: {isListening ? 'Listening...' : isProcessing ? 'Processing (Finalizing)...' : 'Idle'}
        </p>

        {pendingTranscript && (
          <div className="w-full bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg mt-6">
            <h3 className="text-yellow-400 font-semibold mb-2">Review before sending to AI:</h3>
            <p className="text-gray-200 mb-4">{pendingTranscript}</p>
            {audioUrl && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Your recorded voice:</p>
                <audio controls src={audioUrl} className="w-full h-10 rounded" />
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(pendingTranscript);
                  window.speechSynthesis.speak(utterance);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors shadow-lg"
              >
                🔊 Listen
              </button>
              <button
                onClick={confirmSendToAI}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors shadow-lg"
              >
                ✅ OK (Send to AI)
              </button>
              <button
                onClick={cancelTranscript}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-colors shadow-lg"
              >
                ❌ Retry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-3xl border border-gray-700 flex-1 flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Transcripts</h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          {transcripts.length === 0 && (
            <p className="text-gray-500 italic text-center mt-8">No transcripts yet. Start recording to test the model.</p>
          )}
          {transcripts.map((text, i) => (
            <div key={i} className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-gray-200 flex justify-between items-center gap-4">
              <span className="flex-1">{text}</span>
              <button
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(text);
                  window.speechSynthesis.speak(utterance);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors shadow-lg flex-shrink-0"
              >
                🔊 Listen
              </button>
            </div>
          ))}
          {transcript && (
             <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-gray-400 italic">
               {transcript}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
