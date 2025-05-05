import React, { useEffect, useRef, useState } from 'react';
import { useVoiceMode } from './voice/useVoiceMode';
import MicVisualizer from './voice/MicVisualizer';
import VoiceStatus from './voice/VoiceStatus';
import VoiceControls from './voice/VoiceControls';
import { VoiceModeStatus } from './voice/types';
import { synthesizeSpeech } from './voice/voiceApi';
import { UIMessage } from '@ai-sdk/ui-utils';
import { ChangeEvent } from 'react';

type UIPart = UIMessage['parts'][number];

interface VoiceModeProps {
  onExit: () => void;
  handleSubmit: (event?: { preventDefault?: () => void } | undefined) => void;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  input: string;
  messages: UIMessage[];
}

// Helper type guard for text parts
function isTextUIPart(part: UIPart): part is Extract<UIPart, { type: 'text'; text: string }> {
  return part.type === 'text' && typeof (part as Extract<UIPart, { type: 'text'; text: string }>).text === 'string';
}

export default function VoiceMode({ onExit, handleSubmit, handleInputChange, input, messages }: VoiceModeProps) {
  const {
    status,
    setStatus,
    volume,
    micEnabled,
    setMicEnabled,
    lastTranscript,
    clearLastTranscript,
    language,
  } = useVoiceMode();

  const [pendingSubmit, setPendingSubmit] = useState<string | null>(null);

  // Submit the transcript as a user message when available
  useEffect(() => {
    if (lastTranscript) {
      console.log('[VoiceMode] Submitting transcript to LLM:', lastTranscript);
      const syntheticEvent = { target: { value: lastTranscript } } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(syntheticEvent);
      setPendingSubmit(lastTranscript);
      clearLastTranscript();
      console.log('[VoiceMode] Cleared lastTranscript');
    }
  }, [lastTranscript, handleInputChange, clearLastTranscript]);

  useEffect(() => {
    if (pendingSubmit && input === pendingSubmit) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
      console.log('[VoiceMode] Called handleSubmit with transcript');
      setPendingSubmit(null);
    }
  }, [input, pendingSubmit, handleSubmit]);

  // Track the last agent message played
  const lastAgentIdRef = useRef<string | null>(null);

  // Play TTS for new agent messages
  const agentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const textPart = lastMsg?.parts.find(isTextUIPart);
    if (
      lastMsg &&
      lastMsg.role === 'assistant' &&
      lastMsg.id !== lastAgentIdRef.current &&
      textPart &&
      textPart.text.trim() // Only if text is non-empty
    ) {
      console.log('[VoiceMode] New agent message detected:', lastMsg);
      (async () => {
        try {
          const audioBlob = await synthesizeSpeech(textPart.text, language);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new window.Audio(audioUrl);
          agentAudioRef.current = audio;
          audio.onplay = () => setStatus(VoiceModeStatus.AgentSpeaking);
          audio.onended = () => {
            setStatus(VoiceModeStatus.Idle);
            URL.revokeObjectURL(audioUrl);
            agentAudioRef.current = null;
          };
          audio.onerror = () => {
            setStatus(VoiceModeStatus.Idle);
            URL.revokeObjectURL(audioUrl);
            agentAudioRef.current = null;
          };
          audio.play();
        } catch {
          setStatus(VoiceModeStatus.Idle);
          agentAudioRef.current = null;
        }
      })();
      lastAgentIdRef.current = lastMsg.id;
    }
  }, [messages, setStatus, language]);

  // Interrupt agent audio if user starts speaking
  useEffect(() => {
    if (status === VoiceModeStatus.Recording && agentAudioRef.current) {
      agentAudioRef.current.pause();
      agentAudioRef.current.currentTime = 0;
      agentAudioRef.current = null;
      setStatus(VoiceModeStatus.Recording); // Ensure state is correct
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <VoiceStatus status={status} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <MicVisualizer volume={volume} status={status} />
      </div>
      <VoiceControls
        micEnabled={micEnabled}
        setMicEnabled={setMicEnabled}
        onExit={onExit}
        status={status}
      />
    </div>
  );
}