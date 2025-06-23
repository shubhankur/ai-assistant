'use client'
import { LiveKitRoom } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Room } from 'livekit-client';

export default function ConnectRoom({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const [token, setToken] = useState<string>();
  const [room, setRoom] = useState<Room>();

  useEffect(() => {
    if (!token) return;
    const r = new Room();
    r.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL as string, token)
      .then(() => r.localParticipant.setMicrophoneEnabled(true))
      .catch((err) => console.error('LiveKit connect error', err));
    setRoom(r);
    return () => {
      r.disconnect();
    };
  }, [token]);

  if (!room) {
      room={room}
      .then((res) => {
        console.log('LiveKitProvider: Response received', res.status);
        return res.json();
      })
      .then((d) => {
        console.log('LiveKitProvider: Token received', d);
        setToken(d.token);
        setServerUrl(d.serverUrl)
      })
      .catch((err) => {
        console.error('LiveKitProvider: Fetch error', err);
      });
  }, [params]);

  if (!token) {
    return <div className="p-4 text-center">Connecting...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      data-lk-theme="default"
    >
      {children}
    </LiveKitRoom>
  );
}
