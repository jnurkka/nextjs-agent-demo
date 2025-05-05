import { useEffect, useRef, useState } from 'react';

interface UseVADOptions {
  audioLevelThreshold?: number;
  minSpeakingDurationMs?: number;
  silenceDurationMs?: number;
  enabled?: boolean;
}

let vadInstanceCount = 0;

export function useVAD({
  audioLevelThreshold = 0.02,
  minSpeakingDurationMs = 250,
  silenceDurationMs = 900,
  enabled = true,
}: UseVADOptions = {}) {
  const [volume, setVolume] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: instance count
  useEffect(() => {
    vadInstanceCount++;
    console.log(`[useVAD] Instance mounted. Count: ${vadInstanceCount}`);
    if (vadInstanceCount > 1) {
      console.warn('[useVAD] Warning: Multiple VAD instances running!');
    }
    return () => {
      vadInstanceCount--;
      console.log(`[useVAD] Instance unmounted. Count: ${vadInstanceCount}`);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let mediaStream: MediaStream | null = null;
    let animationFrame: number | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stopped = false;
    navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } }).then((stream) => {
      mediaStream = stream;
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioContextClass();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function updateVolume() {
        if (stopped) return;
        analyser!.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const vol = Math.sqrt(sum / dataArray.length);
        setVolume(vol);
        // VAD logic
        if (vol > audioLevelThreshold) {
          if (!speaking && !speakingTimeoutRef.current) {
            speakingTimeoutRef.current = setTimeout(() => {
              setSpeaking(true);
              speakingTimeoutRef.current = null;
            }, minSpeakingDurationMs);
          }
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else {
          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
          }
          if (speaking && !silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              setSpeaking(false);
              silenceTimeoutRef.current = null;
            }, silenceDurationMs);
          }
        }
        animationFrame = requestAnimationFrame(updateVolume);
      }
      updateVolume();
    });
    return () => {
      stopped = true;
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [audioLevelThreshold, minSpeakingDurationMs, silenceDurationMs, enabled, speaking]);

  return { volume, speaking };
}