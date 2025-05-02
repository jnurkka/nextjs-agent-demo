import { NextRequest, NextResponse } from 'next/server';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_SERVER_URL = process.env.LIVEKIT_SERVER_URL!;

// Use dynamic import to avoid issues with Next.js edge runtime
export async function POST(req: NextRequest) {
  const { identity, room = 'default-room' } = await req.json();

  if (!identity) {
    return NextResponse.json({ error: 'Missing identity' }, { status: 400 });
  }

  // Import server SDK only when needed
  const { AccessToken } = await import('livekit-server-sdk');

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
  });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

  const token = at.toJwt();

  return NextResponse.json({ token, serverUrl: LIVEKIT_SERVER_URL });
}