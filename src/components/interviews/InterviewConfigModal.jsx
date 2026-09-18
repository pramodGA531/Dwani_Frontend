import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function InterviewConfigModal({ isOpen, onClose, onConfirm, candidateName }) {
  const [config, setConfig] = useState({
    interview_type: 'Technical Interview',
    difficulty: 'Medium',
    duration: 30,
    camera: true,
    mic: true,
    coding: false,
    screenShare: false,
    retake: false,
    autoSubmit: true
  });

  if (!isOpen) return null;

  const interviewTypes = [
    { id: 'Technical Interview', label: 'Technical Interview', icon: 'code' },
    { id: 'HR Interview', label: 'HR Interview', icon: 'person' },
    { id: 'Behavioral Round', label: 'Behavioral Round', icon: 'psychology' },
    { id: 'Coding Assessment', label: 'Coding Assessment', icon: 'terminal' },
  ];

  const durations = [15, 30, 45, 60];

  const toggleSwitch = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configure Interview</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Setting up AI session for <span className="text-blue-600">{candidateName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 md:max-h-[75vh] space-y-8">
          
          {/* Section 1: Interview Type */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Interview Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setConfig(prev => ({ ...prev, interview_type: type.id }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    config.interview_type === type.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{type.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 2: Difficulty */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Difficulty Level</h3>
              <select 
                value={config.difficulty}
                onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              >
                <option value="Easy">Easy - Basic concepts</option>
                <option value="Medium">Medium - Standard evaluation</option>
                <option value="Hard">Hard - Deep technical expertise</option>
              </select>
            </section>

            {/* Section 3: Duration */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Session Duration</h3>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setConfig(prev => ({ ...prev, duration: d }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      config.duration === d 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Section 4: Toggle Switches */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Hardware & Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
              <ToggleSwitch 
                label="Enable Camera" 
                enabled={config.camera} 
                onChange={() => toggleSwitch('camera')} 
                icon="videocam"
              />
              <ToggleSwitch 
                label="Enable Microphone" 
                enabled={config.mic} 
                onChange={() => toggleSwitch('mic')} 
                icon="mic"
              />
              <ToggleSwitch 
                label="Coding Round" 
                enabled={config.coding} 
                onChange={() => toggleSwitch('coding')} 
                icon="code_blocks"
              />
              <ToggleSwitch 
                label="Screen Sharing" 
                enabled={config.screenShare} 
                onChange={() => toggleSwitch('screenShare')} 
                icon="screen_share"
              />
              <ToggleSwitch 
                label="Allow Retake" 
                enabled={config.retake} 
                onChange={() => toggleSwitch('retake')} 
                icon="history"
              />
              <ToggleSwitch 
                label="Auto Submit" 
                enabled={config.autoSubmit} 
                onChange={() => toggleSwitch('autoSubmit')} 
                icon="send_and_archive"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
           <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-500 font-bold text-sm w-full sm:w-auto"
           >
            Cancel
           </Button>
           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button 
                variant="outline" 
                className="border-gray-200 text-gray-700 font-bold text-sm h-11 px-6 w-full sm:w-auto"
                onClick={() => onConfirm(config, false)}
             >
              Save Config
             </Button>
             <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 px-8 shadow-lg shadow-blue-100 w-full sm:w-auto"
                onClick={() => onConfirm(config, true)}
             >
              Send Interview Link
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ label, enabled, onChange, icon }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
