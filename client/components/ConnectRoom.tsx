'use client'
import { Metadata } from '@/app/session/page';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';

export default function ConnectRoom({
  children,
  metadata,
}: {
  children: ReactNode;
  metadata: JSON | Metadata
}) {
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  useEffect(() => {
    if (token || !metadata) return;
    const q = metadata ? `?metadata=${encodeURIComponent(JSON.stringify(metadata))}` : '';
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
  }, [metadata, token]);

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
