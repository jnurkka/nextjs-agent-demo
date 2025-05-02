import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio');
  const language = formData.get('language') || 'en';

  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
  }

  const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: (() => {
      const fd = new FormData();
      fd.append('file', audio, 'audio.webm');
      fd.append('model', 'whisper-1');
      fd.append('language', language);
      return fd;
    })(),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.json();
    return NextResponse.json({ error: err }, { status: openaiRes.status });
  }

  const data = await openaiRes.json();
  return NextResponse.json({ text: data.text });
}