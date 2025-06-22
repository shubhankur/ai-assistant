'use client'
import { LiveKitRoom } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';

export default function LiveKitProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>();
  useEffect(() => {
    fetch('/api/token')
      .then((res) => {
        console.log('LiveKitProvider: Response received', res.status);
        return res.json();
      })
      .then((d) => {
        console.log('LiveKitProvider: Token received', d);
        setToken(d.token);
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
      serverUrl={process.env.LIVEKIT_URL}
      connect
      data-lk-theme="default"
    >
      {children}
    </LiveKitRoom>
  );
}
