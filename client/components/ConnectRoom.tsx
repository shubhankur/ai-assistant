'use client'
import { LiveKitRoom } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';

export default function ConnectRoom({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  useEffect(() => {
    fetch('/api/token')
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
  }, []);

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
