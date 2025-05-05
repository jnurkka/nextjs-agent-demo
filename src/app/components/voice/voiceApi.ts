export async function transcribeAudio(audioBlob: Blob, language: string) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  formData.append('language', language);
  const res = await fetch('/api/whisper-stt', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || res.statusText);
  return data.text;
}

export async function getAgentResponse(messages: { role: string, content: string }[]) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const raw = await res.text();
  try {
    const data = JSON.parse(raw);
    return data.choices?.[0]?.message?.content || '[No response]';
  } catch {
    // fallback for streaming/chunked
    const lines = raw.split('\n');
    const contentLines = lines.filter(line => line.startsWith('0:')).map(line => {
      const match = line.match(/^0:"(.*)"$/);
      return match ? match[1] : '';
    });
    return contentLines.join('') || '[No response]';
  }
}

export async function synthesizeSpeech(text: string, language: string) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error('TTS failed');
  return await res.blob();
}