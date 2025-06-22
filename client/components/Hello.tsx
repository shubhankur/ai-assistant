'use client'
import { useEffect, useRef } from 'react';
import Vara from 'vara';

export default function Hello() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current) {
      // @ts-expect-error library lacks types
      new Vara(
        container.current,
        'https://cdn.jsdelivr.net/npm/vara@1.4.1/fonts/Satisfy/SatisfySL.json',
        [{ text: 'Hello', duration: 4000 }],
        { fontSize: 80, strokeWidth: 1.5, color: '#0f172a', textAlign: 'center' }
      );
    }
  }, []);
  return <div ref={container} className="h-32 w-full flex justify-center" />;
}
