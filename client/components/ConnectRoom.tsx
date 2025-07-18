'use client'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';

export default function ConnectRoom({
  children,
  feelings,
}: {
  children: ReactNode;
  feelings: string;
}) {
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  useEffect(() => {
    if (token || !feelings) return;
    const q = feelings ? `?feelings=${encodeURIComponent(feelings)}` : '';
    console.log("feelings in connect room", q)
    fetch(`/api/token${q}`)
      .then((res) => {
        console.log('LiveKitProvider: Response received', res.status);
        return res.json();
      })
      .then((d) => {
        console.log('LiveKitProvider: Token received', d);
        setToken(d.token);
        setServerUrl(d.serverUrl);
      })
      .catch((err) => {
        console.error('LiveKitProvider: Fetch error', err);
      });
  }, [feelings, token]);

  if (!token) {
    return <div className="p-4 text-center">Connecting...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      data-lk-theme="default"
      audio = {true}
    >
      {children}
    </LiveKitRoom>
  );
}
