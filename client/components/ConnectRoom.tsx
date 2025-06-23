'use client'
import { LiveKitRoom } from '@livekit/components-react';
import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ConnectRoom({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const [token, setToken] = useState<string>();
  const [serverUrl, setServerUrl] = useState<string>();
  useEffect(() => {
    const query = new URLSearchParams(params.toString());
    fetch(`/api/token?${query.toString()}`)
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
