'use client'
import { useEffect, useRef } from 'react';
import Vara from 'vara';
// Track whether the Vara animation has already been rendered to avoid duplicates

export default function Hello() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current) {
      new Vara(
        '#hello-container',
        'https://cdn.jsdelivr.net/npm/vara@1.4.1/fonts/Satisfy/SatisfySL.json',
        [{ text: 'Hello', duration: 4000 }],
        { fontSize: 80, strokeWidth: 1.5, color: '#ffffff', textAlign: 'center' }
      );
    }
  }, []);
  return <div id="hello-container" ref={container} className="h-32 w-full flex justify-center" />;
}