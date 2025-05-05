import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { VoiceModeStatus } from './types';
import { transcribeAudio } from './voiceApi';
import { useVAD } from './useVAD';
import { useMediaRecorder } from './useMediaRecorder';

export function useVoiceMode() {
  const [status, setStatus] = useState<VoiceModeStatus>(VoiceModeStatus.Idle);
  const [micEnabled, setMicEnabled] = useState(true);
  const [language] = useState<'en' | 'de'>('en');
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  // VAD
  const { volume, speaking } = useVAD({ enabled: micEnabled });
  // MediaRecorder
  const { isRecording, audioBlob, startRecording, stopRecording, clearAudioBlob } = useMediaRecorder();

  // Debug: log speaking changes
  useEffect(() => {
    console.log('[VAD] speaking:', speaking);
  }, [speaking]);

  // Manage status based on speaking transitions
  const prevSpeakingRef = useRef(speaking);
  useEffect(() => {
    const prevSpeaking = prevSpeakingRef.current;
    if (!prevSpeaking && speaking) {
      setStatus(VoiceModeStatus.Recording);
    } else if (prevSpeaking && !speaking) {
      setStatus(VoiceModeStatus.Processing);
    }
    prevSpeakingRef.current = speaking;
  }, [speaking]);

  // Debug: log status changes
  useEffect(() => {
    console.log('[Status] status:', status);
  }, [status]);

  // Start/stop recording based on status
  useEffect(() => {
    if (!micEnabled) return;
    if (status === VoiceModeStatus.Recording && !isRecording) {
      startRecording();
    } else if (status !== VoiceModeStatus.Recording && isRecording) {
      stopRecording();
    }
  }, [status, micEnabled, isRecording, startRecording, stopRecording]);

  // When audioBlob is available, process it (STT only)
  useEffect(() => {
    if (!audioBlob) return;
    (async () => {
      setStatus(VoiceModeStatus.Processing);
      try {
        // 1. STT
        const sttText = await transcribeAudio(audioBlob, language);
        setLastTranscript(sttText);
      } catch {
        setStatus(VoiceModeStatus.Idle);
      }
      clearAudioBlob();
    })();
  }, [audioBlob, language, clearAudioBlob]);

  // Reset to idle if mic is disabled
  useEffect(() => {
    if (!micEnabled) setStatus(VoiceModeStatus.Idle);
  }, [micEnabled]);

  // Memoized clearLastTranscript
  const clearLastTranscript = useCallback(() => setLastTranscript(null), []);

  // Memoize returned values to avoid unnecessary re-renders
  return useMemo(() => ({
    status,
    setStatus,
    volume,
    micEnabled,
    setMicEnabled,
    lastTranscript,
    clearLastTranscript,
    language,
  }), [status, volume, micEnabled, lastTranscript, clearLastTranscript, language]);
}