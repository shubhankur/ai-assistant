'use client'
import Link from 'next/link'

export default function TitleBar() {
  return (
    <header className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4">
        <h1 className="font-bold text-lg">Dummy</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/session" className="hover:underline">Session</Link>
          <Link href="/dummy" className="hover:underline">Demo</Link>
        </nav>
      </div>
    </header>
  )
}
