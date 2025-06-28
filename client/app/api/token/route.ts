import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const feelings = searchParams.get('feelings') || '';
  const id = Math.random().toString(36).slice(2, 10)
  const identity = `user-${id}`;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;
  const roomName = `room-${id}`;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName });
  at.metadata = feelings;
  const token = await at.toJwt();

  return NextResponse.json({ token, serverUrl });
}
