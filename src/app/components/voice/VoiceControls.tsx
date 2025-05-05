import React from 'react';
import { VoiceModeStatus } from './types';

interface VoiceControlsProps {
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  onExit: () => void;
  status: VoiceModeStatus;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ micEnabled, setMicEnabled, onExit, status }) => (
  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
    {/* Mic enable/disable button */}
    <button
      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-2xl transition-all duration-150 ${micEnabled ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-[#fae1e8]'} `}
      onClick={() => setMicEnabled(!micEnabled)}
      aria-label={micEnabled ? 'Disable microphone' : 'Enable microphone'}
    >
      {micEnabled ? (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2" /><line x1="12" y1="22" x2="12" y2="18" /><line x1="8" y1="22" x2="16" y2="22" /></svg>
      ) : (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="#e5393522" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
          <line x1="12" y1="22" x2="12" y2="18" />
          <line x1="8" y1="22" x2="16" y2="22" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="#e53935" strokeWidth="2.5" />
        </svg>
      )}
    </button>
    <button
      className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 shadow-lg text-2xl hover:bg-gray-300 transition-all duration-150"
      onClick={onExit}
      disabled={status === VoiceModeStatus.Processing}
      aria-label="Exit"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    </button>
  </div>
);

export default VoiceControls;