import { useCallback, useRef, useState, useEffect } from 'react';

let recorderInstanceCount = 0;

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Debug: instance count
  useEffect(() => {
    recorderInstanceCount++;
    console.log(`[useMediaRecorder] Instance mounted. Count: ${recorderInstanceCount}`);
    if (recorderInstanceCount > 1) {
      console.warn('[useMediaRecorder] Warning: Multiple MediaRecorder instances running!');
    }
    return () => {
      recorderInstanceCount--;
      console.log(`[useMediaRecorder] Instance unmounted. Count: ${recorderInstanceCount}`);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
    recorder.onstop = () => {
      setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearAudioBlob = useCallback(() => setAudioBlob(null), []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearAudioBlob,
  };
}