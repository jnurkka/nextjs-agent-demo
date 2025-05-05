import React from 'react';
import { VoiceModeStatus } from './types';

interface VoiceStatusProps {
  status: VoiceModeStatus;
}

const statusTextMap: Record<VoiceModeStatus, string> = {
  [VoiceModeStatus.Idle]: 'Start speaking to initiate conversation',
  [VoiceModeStatus.Recording]: 'Recording...',
  [VoiceModeStatus.Processing]: 'Thinking...',
  [VoiceModeStatus.AgentSpeaking]: 'Agent is speaking...',
  [VoiceModeStatus.Listening]: 'Listening...'
};

const VoiceStatus: React.FC<VoiceStatusProps> = ({ status }) => (
  <div className="absolute top-1/4 left-0 right-0 flex justify-center">
    <span className="text-lg text-gray-500 font-medium">
      {statusTextMap[status]}
    </span>
  </div>
);

export default VoiceStatus;