'use client'
import { LiveKitRoom } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';

export default function LiveKitProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>();
  useEffect(() => {
    fetch('/api/token')
      .then((res) => res.json())
      .then((d) => setToken(d.token));
  }, []);

  if (!token) {
    return <div className="p-4 text-center">Connecting...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect
      data-lk-theme="default"
    >
      {children}
    </LiveKitRoom>
  );
}
