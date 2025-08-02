'use client';
import Link from 'next/link';

export default function SideNav() {
  return (
    <nav className="w-48 bg-gray-900 text-white min-h-screen p-4">
      <ul className="space-y-2">
        <li><Link href="/today">Today</Link></li>
        <li><Link href="/tomorrow">Tomorrow</Link></li>
        <li><Link href="/aspirations">Aspirations</Link></li>
        <li><Link href="/ai-suggestions">AI Suggestions</Link></li>
        <li><Link href="/weekly-routine">Weekly Routine</Link></li>
      </ul>
    </nav>
  );
}
