import React, { useEffect, useRef, useState } from 'react';
import { LocalParticipant, Room } from 'livekit-client';

// Helper to get a random user identity
function randomIdentity() {
  return 'user-' + Math.random().toString(36).substring(2, 10);
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceModeProps {
  onExit: () => void;
  onMessage?: (msg: { id: string; role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }) => void;
}

// Placeholder for future LiveKit and audio visualization integration
export default function VoiceMode({ onExit, onMessage }: VoiceModeProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [identity] = useState(randomIdentity());
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [autoMode, setAutoMode] = useState(true);
  const audioLevelThreshold = 0.08;
  const silenceDurationMs = 900;
  // VAD-driven turn-taking
  const [speaking, setSpeaking] = useState(false);
  const prevSpeakingRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch LiveKit token on mount
  useEffect(() => {
    fetch('/api/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('LiveKit token data:', data);
        console.log('LiveKit token:', data.token);
        console.log('LiveKit server URL:', data.serverUrl);
        setToken(data.token);
        setServerUrl(data.serverUrl);
      });
  }, [identity]);

  // Always-on audio context for visualization
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let mediaStream: MediaStream | null = null;
    let animationFrame: number | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let stopped = false;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
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
        setVolume(Math.sqrt(sum / dataArray.length));
        animationFrame = requestAnimationFrame(updateVolume);
      }
      updateVolume();
    });
    return () => {
      stopped = true;
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  // MediaRecorder logic (decoupled from visualization)
  useEffect(() => {
    if (!isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      return;
    }
    // Start a new MediaRecorder for the utterance
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log('MediaRecorder chunk received, size:', e.data.size);
        } else {
          console.log('MediaRecorder chunk received, but size is 0');
        }
      };
      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio Blob:', audioBlob);
        console.log('Blob size:', audioBlob.size, 'type:', audioBlob.type);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('language', language);
        const sttRes = await fetch('/api/whisper-stt', { method: 'POST', body: formData });
        let sttData;
        try {
          sttData = await sttRes.json();
        } catch {
          sttData = { error: 'Failed to parse STT response' };
        }
        console.log('STT response:', sttData);
        if (!sttRes.ok || sttData.error) {
          const userMsg = { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: `[STT error] ${sttData.error || sttRes.status}` }] } as const;
          setMessages((msgs) => [...msgs, { role: 'user', text: `[STT error] ${sttData.error || sttRes.status}` }]);
          onMessage?.({ ...userMsg, parts: [...userMsg.parts] });
          setIsProcessing(false);
          audioChunksRef.current = [];
          return;
        }
        const userMsg = { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: sttData.text }] } as const;
        setMessages((msgs) => [...msgs, { role: 'user', text: sttData.text }]);
        onMessage?.({ ...userMsg, parts: [...userMsg.parts] });
        // 2. Send transcription to chat API
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: sttData.text }
          ] }),
        });
        const rawChatText = await chatRes.text();
        console.log('Raw /api/chat response:', rawChatText);
        let chatData;
        let agentText = '[No response]';
        try {
          chatData = JSON.parse(rawChatText);
          agentText = chatData.choices?.[0]?.message?.content || '[No response]';
        } catch {
          // Try to parse streaming/chunked response
          const lines = rawChatText.split('\n');
          const contentLines = lines.filter(line => line.startsWith('0:')).map(line => {
            const match = line.match(/^0:"(.*)"$/);
            return match ? match[1] : '';
          });
          agentText = contentLines.join('');
          if (!agentText) {
            setMessages((msgs) => [...msgs, { role: 'assistant', text: '[Chat API error: Invalid JSON]' }]);
            setIsProcessing(false);
            audioChunksRef.current = [];
            return;
          }
        }
        const agentMsg = { id: Date.now().toString(), role: 'assistant', parts: [{ type: 'text', text: agentText }] } as const;
        setMessages((msgs) => [...msgs, { role: 'assistant', text: agentText }]);
        onMessage?.({ ...agentMsg, parts: [...agentMsg.parts] });
        // 3. Send agent response to TTS
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: agentText, language }),
        });
        if (ttsRes.ok) {
          const audio = new Audio();
          ttsAudioRef.current = audio;
          const audioBlob = await ttsRes.blob();
          audio.src = URL.createObjectURL(audioBlob);
          audio.play();
        }
        setIsProcessing(false);
        audioChunksRef.current = [];
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    });
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [isRecording, language, messages, onMessage]);

  // VAD-driven turn-taking
  useEffect(() => {
    if (!autoMode) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      return;
    }
    console.log('[VAD] volume:', volume, 'speaking:', speaking);
    if (volume > audioLevelThreshold) {
      if (!speaking) console.log('[VAD] speaking set to true');
      setSpeaking(true);
      if (silenceTimeoutRef.current) {
        console.log('[VAD] clearing silence timeout');
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      if (speaking && !silenceTimeoutRef.current) {
        console.log('[VAD] setting silence timeout');
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('[VAD] silence timeout fired, speaking set to false');
          setSpeaking(false);
          silenceTimeoutRef.current = null;
        }, silenceDurationMs);
      }
    }
    // Only clean up on unmount or autoMode change
    return () => {
      if (!autoMode && silenceTimeoutRef.current) {
        console.log('[VAD] cleaning up silence timeout');
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, autoMode, speaking]);

  // Manage isRecording based on speaking transitions
  useEffect(() => {
    if (!autoMode) return;
    const prevSpeaking = prevSpeakingRef.current;
    if (!prevSpeaking && speaking) {
      // Transition: not speaking -> speaking
      setIsRecording(true);
    } else if (prevSpeaking && !speaking) {
      // Transition: speaking -> not speaking
      setIsRecording(false);
    }
    prevSpeakingRef.current = speaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking, autoMode]);

  // LiveKit room join and VAD logic
  useEffect(() => {
    if (!token || !serverUrl) return;
    let room: Room | null = null;
    let localParticipant: LocalParticipant | null = null;
    import('livekit-client').then(() => {
      room = new Room();
      room.connect(serverUrl, token).then(() => {
        localParticipant = room!.localParticipant;
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          localParticipant?.publishTrack(stream.getAudioTracks()[0]);
          console.log('[LiveKit] Published local audio track');
        });
      });
    });
    return () => {
      if (room) room.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, serverUrl]);

  // After TTS playback, auto-restart listening if in autoMode
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!autoMode) return;
    if (!isProcessing && !isRecording && ttsAudioRef.current) {
      ttsAudioRef.current.onended = () => {
        setIsRecording(true);
      };
    }
  }, [isProcessing, isRecording, autoMode]);

  // UI
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-lg">
      <div className="bg-white/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[400px]">
        <div className="mb-6 w-full flex flex-col items-center">
          <div className="w-64 h-32 flex items-center justify-center">
            {/* Volume bar visualization */}
            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex items-center">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-100"
                style={{ width: `${Math.min(100, Math.round(volume * 200))}%` }}
              />
            </div>
            <span className="ml-4 text-lg font-bold text-gray-700">{isRecording ? '🎤' : '🔇'}</span>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <button
            className={`px-6 py-3 rounded-xl font-bold shadow transition ${isRecording ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-[#a259f7] to-[#6a11cb] text-white'}`}
            onClick={() => !isProcessing && setIsRecording((r) => !r)}
            disabled={isProcessing || autoMode}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold shadow hover:bg-gray-400 transition"
            onClick={onExit}
            disabled={isProcessing}
          >
            Exit
          </button>
          <select
            className="ml-2 px-2 py-1 rounded border border-gray-300 text-gray-700"
            value={language}
            onChange={e => setLanguage(e.target.value as 'en' | 'de')}
            disabled={isProcessing || isRecording}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <label className="ml-4 flex items-center gap-2">
            <input type="checkbox" checked={autoMode} onChange={e => setAutoMode(e.target.checked)} />
            <span className="text-sm text-gray-700">Auto Mode</span>
          </label>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {autoMode && (speaking ? 'Listening: You are speaking…' : 'Listening for speech…')}
        </div>
        {/* LiveKit connection status */}
        <div className="mt-4 text-sm text-gray-500">
          {token && serverUrl ? (
            <span>Connected to LiveKit as <b>{identity}</b></span>
          ) : (
            <span>Connecting to LiveKit…</span>
          )}
        </div>
        <div className="mt-6 w-full bg-white/60 rounded-xl p-4 max-h-40 overflow-y-auto backdrop-blur-sm blur-sm">
          {messages.length === 0 && <div className="text-gray-400 italic">Transcriptions and responses will appear here…</div>}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-blue-700' : 'text-purple-700'}`}>
              <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.text}
            </div>
          ))}
        </div>
        {isProcessing && <div className="mt-4 text-lg text-purple-600 font-bold animate-pulse">Processing…</div>}
      </div>
    </div>
  );
}