import React from 'react';
import { VoiceModeStatus } from './types';

interface MicVisualizerProps {
  volume: number;
  status: VoiceModeStatus;
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ volume }) => {
  return (
    <div className="flex items-center justify-center" style={{ height: 240 }}>
      <div
        className="transition-all duration-150 flex items-center justify-center"
        style={{
          width: 160 + volume * 60,
          height: 160 + volume * 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 40%, #ff7eb3 60%, #ff758c 100%)',
          boxShadow: `0 0 ${24 + volume * 40}px 0 #ff758c88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s, box-shadow 0.2s, width 0.1s, height 0.1s',
          opacity: 1,
          filter: 'none',
          position: 'relative',
        }}
      >
        {/* Mic SVG */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff8" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
          <line x1="12" y1="22" x2="12" y2="18" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </div>
    </div>
  );
};

export default MicVisualizer;