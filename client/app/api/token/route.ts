import { NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { Room } from 'livekit-server-sdk';


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const metadataStr = searchParams.get('metadata') || '';
  let id = Math.random().toString(36).slice(2, 10);
  const meta = JSON.parse(metadataStr);
  if (meta.userId) id = meta.userId;
  else return NextResponse.json({ error: 'Missing User Id' }, { status: 500 });
  console.log(metadataStr)
  const identity = id;
  const roomName = `roomba-${id}`;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;

  if (!serverUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  /* 1.  Create (or update) the room with metadata */
  const roomSvc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
  try
  {
    await roomSvc.createRoom({ name: roomName, metadata: metadataStr});
  } catch (err) {
    await roomSvc.updateRoomMetadata(roomName, metadataStr);
  }

  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName, canUpdateOwnMetadata: true, canPublishData: true, canSubscribe: true });
  at.metadata = metadataStr;
  const token = await at.toJwt();

  return NextResponse.json({ token, serverUrl});
}
