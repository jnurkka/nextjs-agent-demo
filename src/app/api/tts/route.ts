import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(req: NextRequest) {
  const { text, language = 'en' } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy', // default OpenAI voice
      response_format: 'mp3',
      language,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.json();
    return NextResponse.json({ error: err }, { status: openaiRes.status });
  }

  const audioBuffer = await openaiRes.arrayBuffer();
  return new NextResponse(Buffer.from(audioBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="speech.mp3"',
    },
  });
}