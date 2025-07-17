'use client'
import Link from 'next/link';
import { TypeAnimation } from 'react-type-animation';
import { useState } from 'react';
import Hello from '../components/Hello';

const options = ['motivated', 'lost', 'grateful', 'low', 'focused', 'distracted'];

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (opt: string) => {
    setSelected((s) =>
      s.includes(opt) ? s.filter((i) => i !== opt) : [...s, opt]
    );
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gradient-to-br from-[var(--color-bg-start)] to-[var(--color-bg-end)] p-6">
      <Hello />
      <TypeAnimation
        sequence={["How are you feeling today?"]}
        wrapper="span"
        speed={50}
        className="text-xl text-gray-700"
      />
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={`px-4 py-2 rounded-full transition-colors border backdrop-blur-md ${selected.includes(o) ? 'bg-[var(--color-primary)] text-white' : 'bg-white/60 text-gray-800'}`}
          >
            {o}
          </button>
        ))}
      </div>
      <Link
        href={{
          pathname: "/session",
          query: { feelings: selected.join(",") },
        }}
        className="mt-4 px-6 py-2 rounded bg-[var(--color-secondary)] text-white"
      >
        Continue
      </Link>
    </div>
  );
}
