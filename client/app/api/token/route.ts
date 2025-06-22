import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET() {
  const identity = `user-${Math.random().toString(36).slice(2, 10)}`;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const roomName = 'voice-assistant';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName });
  const token = await at.toJwt();

  return NextResponse.json({ token });
}
