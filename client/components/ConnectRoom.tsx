'use client'
import { Metadata } from '@/app/session/page';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';
import { SERVER_URL } from '@/utils/constants';

export default function ConnectRoom({
  children,
  metadata,
}: {
  children: ReactNode;
  metadata: Metadata
}) {
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  
  useEffect(() => {
    if (token || !metadata || !metadata.userId) return;
    console.log("metadata received, ", metadata)
    const fetchToken = async () => {
      const q = `?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;
      try {
        const res = await fetch(`${SERVER_URL}/livekit/token${q}`);
        if (!res.ok) {
          const errBody = await res.text(); // capture server error message
          console.log(`Token request failed (${res.status})`, errBody);
          return;
        } 
        const { token, serverUrl } = await res.json();
        setToken(token);
        setServerUrl(serverUrl);
      } catch (err) {
        console.error('Token request crashed', err);
      }
    };

    fetchToken();
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
